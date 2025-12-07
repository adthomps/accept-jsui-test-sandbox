import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors({ origin: '*' }))

app.get('/get-auth-config', async (c) => {
  const clientKey = c.env.AUTHORIZE_NET_CLIENT_KEY || ''
  const apiLoginId = c.env.AUTHORIZE_NET_API_LOGIN_ID || ''
  if (!clientKey || !apiLoginId) {
    return c.json({ success: false, error: 'Auth config missing' }, 500)
  }
  return c.json({
    success: true,
    clientKey,
    apiLoginId,
    environment: {
      apiUrl: 'https://apitest.authorize.net',
      jsUrl: 'https://jstest.authorize.net',
      gatewayUrl: 'https://test.authorize.net'
    }
  })
})

app.post('/process-payment', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  // Minimal validation
  if (!body || !body.amount) {
    return c.json({ success: false, error: 'Missing amount' }, 400)
  }

  // Example: persist pending payment to D1 (if bound) or return a stub
  try {
    if (c.env.DB) {
      // Use D1: this is an example — adapt queries as needed
      const insert = await c.env.DB.prepare(
        `INSERT INTO pending_payments (reference_id, customer_info, amount, create_profile, status) VALUES (?, ?, ?, ?, ?)`
      )
        .bind(body.referenceId || '' , JSON.stringify(body.customer || {}), body.amount, body.createProfile ? 1 : 0, 'pending')
        .run()
    }
  } catch (e) {
    // ignore D1 errors here; return a helpful debug object
    return c.json({ success: false, error: 'D1 error', debug: String(e) }, 500)
  }

  return c.json({ success: true, message: 'Payment queued', debug: { received: body } })
})

export default app
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Keep permissive CORS during migration/testing. Lock to Pages domain in production.
app.use('*', cors({ origin: '*' }))

// Root health-check
app.get('/', (c) => {
  return c.json({ success: true, message: 'Workers API running' })
})

// GET /get-auth-config
app.get('/get-auth-config', (c) => {
  const clientKey = c.env.AUTHORIZE_NET_CLIENT_KEY
  const apiLoginId = c.env.AUTHORIZE_NET_API_LOGIN_ID

  if (!clientKey || !apiLoginId) {
    return c.json({ success: false, error: 'Authorize.Net config missing' }, 500)
  }

  return c.json({
    success: true,
    clientKey,
    apiLoginId,
    environment: {
      apiUrl: 'https://apitest.authorize.net',
      jsUrl: 'https://jstest.authorize.net',
      gatewayUrl: 'https://test.authorize.net'
    }
  })
})

// NOTE: `/process-payment` is implemented later in this file.

// POST /accept-hosted-token - generate hosted payment token
app.post('/accept-hosted-token', async (c) => {
  try {
    const requestBody = await c.req.json()
    const isReturning = requestBody && requestBody.existingCustomerEmail && !requestBody.customerInfo
    const debug = Boolean(requestBody.debug)
    const displayMode = requestBody.displayMode || 'redirect'
    const iframeCommunicatorUrl = requestBody.iframeCommunicatorUrl

    const apiLoginId = c.env.AUTHORIZE_NET_API_LOGIN_ID
    const transactionKey = c.env.AUTHORIZE_NET_TRANSACTION_KEY

    if (!apiLoginId || !transactionKey) {
      return c.json({ success: false, error: 'Authorize.Net credentials not configured' }, 500)
    }

    const referenceId = `${Date.now().toString().slice(-10)}${Math.random().toString(36).substring(2,8)}`

    // Lookup or store pending payment using D1 (if available)
    let customerProfileId = null
    let customerProfileData = null
    try {
      if (isReturning && c.env.DB) {
        const email = requestBody.existingCustomerEmail
        const q = 'SELECT * FROM customer_profiles WHERE email = ? LIMIT 1'
        const res = await c.env.DB.prepare(q).bind(email).all()
        const rows = res && res.results ? res.results : res
        if (rows && rows.length > 0 && rows[0].authorize_net_customer_profile_id) {
          customerProfileId = rows[0].authorize_net_customer_profile_id
          customerProfileData = rows[0]
        } else {
          return c.json({ success: false, error: 'No customer profile found for this email. Please register as a new customer.' }, 400)
        }
      }

      // Store pending_payments if DB present
      if (c.env.DB) {
        const insert = 'INSERT INTO pending_payments (reference_id, customer_info, amount, create_profile, status) VALUES (?, ?, ?, ?, ? )'
        const custInfo = isReturning ? JSON.stringify({ existingCustomerEmail: requestBody.existingCustomerEmail }) : JSON.stringify(requestBody.customerInfo || {})
        const amount = isReturning ? requestBody.amount : (requestBody.customerInfo?.amount || 0)
        await c.env.DB.prepare(insert).bind(referenceId, custInfo, amount, isReturning ? 1 : (requestBody.createProfile ? 1 : 0), 'pending').run()
      } else if (c.env.PENDING_KV) {
        // Fallback to KV for temporary storage
        const key = `pending:${referenceId}`
        await c.env.PENDING_KV.put(key, JSON.stringify({ requestBody }), { expirationTtl: 300 })
      }
    } catch (dbErr) {
      console.warn('DB error:', String(dbErr))
    }

    // Build transactionRequest similar to original function
    const amount = isReturning ? requestBody.amount : (requestBody.customerInfo?.amount || 0)
    const transactionRequest = {
      transactionType: 'authCaptureTransaction',
      amount: String(amount),
    }

    if (customerProfileId) {
      transactionRequest.profile = { customerProfileId }
    } else if (requestBody.customerInfo) {
      const ci = requestBody.customerInfo
      transactionRequest.customer = { email: ci.email }
      transactionRequest.billTo = {
        firstName: ci.firstName,
        lastName: ci.lastName,
        company: ci.company || '',
        address: ci.address,
        city: ci.city,
        state: ci.state,
        zip: ci.zipCode,
        country: ci.country === 'US' ? 'USA' : ci.country,
      }
    }

    // Build hostedPaymentSettings safely — only include URLs that start with http:// or https://
    const settings = []

    // sanitize input URLs: strip BOM, trim, and validate http(s)
    const stripBOM = (s) => (typeof s === 'string' ? s.replace(/^\uFEFF/, '').trim() : s)
    const safeUrl = (u) => {
      const s = stripBOM(u)
      return (typeof s === 'string' && /^https?:\/\//i.test(s)) ? s : undefined
    }
    const safeReturnUrlRaw = safeUrl(requestBody.returnUrl)
    const safeCancelUrlRaw = safeUrl(requestBody.cancelUrl)

    // If the URL is localhost, rewrite origin to https://www.authorize.net to rule out localhost validation issues
    const rewriteLocalToAuthorize = (s) => {
      try {
        const parsed = new URL(s)
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          const targetOrigin = 'https://www.authorize.net'
          return `${targetOrigin.replace(/\/$/, '')}${parsed.pathname}${parsed.search}${parsed.hash}`
        }
        return s
      } catch (e) {
        return s
      }
    }

    const safeReturnUrl = safeReturnUrlRaw ? rewriteLocalToAuthorize(safeReturnUrlRaw) : undefined
    const safeCancelUrl = safeCancelUrlRaw ? rewriteLocalToAuthorize(safeCancelUrlRaw) : undefined

    if (safeReturnUrl || safeCancelUrl) {
      const returnOpts = { showReceipt: displayMode === 'redirect', url: safeReturnUrl, urlText: 'Continue', cancelUrl: safeCancelUrl, cancelUrlText: 'Cancel' }
      settings.push({ settingName: 'hostedPaymentReturnOptions', settingValue: JSON.stringify(returnOpts) })
    }

    settings.push({ settingName: 'hostedPaymentButtonOptions', settingValue: JSON.stringify({ text: 'Complete Payment' }) })
    settings.push({ settingName: 'hostedPaymentPaymentOptions', settingValue: JSON.stringify({ cardCodeRequired: false, showCreditCard: true, showBankAccount: true }) })
    settings.push({ settingName: 'hostedPaymentBillingAddressOptions', settingValue: JSON.stringify({ show: true, required: false }) })
    settings.push({ settingName: 'hostedPaymentCustomerOptions', settingValue: JSON.stringify({ showEmail: false, requiredEmail: false, addPaymentProfile: !!customerProfileId }) })
    const safeIframeCommunicatorUrl = safeUrl(iframeCommunicatorUrl)
    if (displayMode !== 'redirect' && safeIframeCommunicatorUrl) settings.push({ settingName: 'hostedPaymentIFrameCommunicatorUrl', settingValue: JSON.stringify({ url: safeIframeCommunicatorUrl }) })

    const tokenRequest = {
      getHostedPaymentPageRequest: {
        merchantAuthentication: { name: apiLoginId, transactionKey },
        refId: referenceId,
        transactionRequest,
        hostedPaymentSettings: { setting: settings }
      }
    }

    // Send request to Authorize.Net
    const resp = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenRequest),
    })

    const result = await safeParseResponse(resp)
    const root = result?.getHostedPaymentPageResponse ?? result

    if (root?.messages?.resultCode === 'Ok' && typeof root?.token === 'string' && root.token.length > 0) {
      const token = root.token
      return c.json({ success: true, token, displayMode, gatewayUrl: 'https://test.authorize.net/payment/payment', ...(debug ? { debug: { request: { ...tokenRequest, getHostedPaymentPageRequest: { ...tokenRequest.getHostedPaymentPageRequest, merchantAuthentication: { name: '[REDACTED]', transactionKey: '[REDACTED]' } } }, response: root } } : {}) })
    }

    // Build error
    let errorCode = 'UNKNOWN'
    let errorText = 'Failed to generate hosted payment token'
    const messages = root?.messages
    if (messages?.message && Array.isArray(messages.message)) {
      const nonInfo = messages.message.find(m => typeof m?.code === 'string' && !m.code.startsWith('I'))
      const first = nonInfo || messages.message[0]
      if (first) { errorCode = first.code ?? errorCode; errorText = first.text ?? errorText }
    }

    return c.json({ success: false, error: `${errorText}${errorCode ? ` (Code: ${errorCode})` : ''}`, details: { resultCode: messages?.resultCode, errorCode, errorText }, ...(debug ? { debug: { request: tokenRequest, response: root } } : {}) }, 400)

  } catch (error) {
    return c.json({ success: false, error: (error && error.message) ? error.message : String(error) }, 500)
  }
})

// POST /process-payment - process opaqueData txn (port of process-payment)
app.post('/process-payment', async (c) => {
  try {
    const { opaqueData, customerInfo } = await c.req.json()
    if (!opaqueData || !customerInfo) {
      return c.json({ success: false, error: 'Missing payment data' }, 400)
    }

    const apiLoginId = c.env.AUTHORIZE_NET_API_LOGIN_ID
    const transactionKey = c.env.AUTHORIZE_NET_TRANSACTION_KEY
    if (!apiLoginId || !transactionKey) {
      return c.json({ success: false, error: 'Authorize.Net credentials not configured' }, 500)
    }

    const refId = `ref_${Date.now()}`
    const transactionRequest = {
      createTransactionRequest: {
        merchantAuthentication: { name: apiLoginId, transactionKey },
        refId,
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: String(customerInfo.amount),
          payment: { opaqueData: { dataDescriptor: opaqueData.dataDescriptor, dataValue: opaqueData.dataValue } },
          billTo: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            address: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state,
            zip: customerInfo.zipCode,
            country: customerInfo.country,
            email: customerInfo.email
          }
        }
      }
    }

    const endpoint = 'https://apitest.authorize.net/xml/v1/request.api'
    const resp = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transactionRequest) })
    const result = await safeParseResponse(resp)

    const processingStart = Date.now()

    if (result.messages?.resultCode === 'Ok' && result.transactionResponse) {
      const transaction = result.transactionResponse
      return c.json({ success: true, transactionId: transaction.transId, authCode: transaction.authCode, responseCode: transaction.responseCode, messageCode: transaction.messages?.[0]?.code, description: transaction.messages?.[0]?.description, avsResultCode: transaction.avsResultCode, cvvResultCode: transaction.cvvResultCode, accountNumber: transaction.accountNumber, accountType: transaction.accountType, requestId: refId, processing: { startTime: processingStart, endTime: Date.now(), duration: Date.now() - processingStart, timestamp: new Date().toISOString() }, rawResponse: { messages: result.messages, transactionResponse: { ...transaction, transHash: '[REDACTED]', transHashSha2: '[REDACTED]' } } })
    } else {
      const tx = result.transactionResponse || {}
      const msgs = result.messages?.message || []
      const pickMsg = arr => (Array.isArray(arr) && arr.length > 0 ? arr[0] : {})
      const txErr = Array.isArray(tx.errors) && tx.errors.length > 0 ? tx.errors[0] : undefined
      const msg = pickMsg(msgs)
      const errorMessage = txErr?.errorText || msg?.text || 'Transaction failed'
      const errorCode = txErr?.errorCode || msg?.code
      return c.json({ success: false, error: errorMessage, errorCode, resultCode: result.messages?.resultCode, responseCode: tx.responseCode, avsResultCode: tx.avsResultCode, cvvResultCode: tx.cvvResultCode, gateway: { responseCode: tx.responseCode, avsResultCode: tx.avsResultCode, cvvResultCode: tx.cvvResultCode, transId: tx.transId, errors: tx.errors || [], messages: msgs }, requestId: refId, processing: { startTime: processingStart, endTime: Date.now(), duration: Date.now() - processingStart, timestamp: new Date().toISOString() }, rawResponse: { messages: result.messages, transactionResponse: result.transactionResponse } }, 200)
    }

  } catch (error) {
    return c.json({ success: false, error: (error && error.message) ? error.message : String(error) }, 500)
  }
})

// GET /customer-profiles - list profiles from D1 if available
app.get('/customer-profiles', async (c) => {
  try {
    if (c.env.DB) {
      const q = 'SELECT * FROM customer_profiles ORDER BY created_at DESC'
      const res = await c.env.DB.prepare(q).all()
      const rows = res && res.results ? res.results : res
      return c.json(rows || [])
    }
    return c.json([])
  } catch (err) {
    console.warn('customer-profiles error', String(err))
    return c.json([], 500)
  }
})

// POST /create-customer-profile
app.post('/create-customer-profile', async (c) => {
  try {
    const { customerInfo, debug } = await c.req.json()
    const apiLoginId = c.env.AUTHORIZE_NET_API_LOGIN_ID
    const transactionKey = c.env.AUTHORIZE_NET_TRANSACTION_KEY
    if (!apiLoginId || !transactionKey) {
      return c.json({ success: false, error: 'Authorize.Net credentials not configured' }, 500)
    }

    const cimRequest = {
      createCustomerProfileRequest: {
        merchantAuthentication: { name: apiLoginId, transactionKey },
        profile: {
          merchantCustomerId: `cust_${Date.now()}`,
          description: `${customerInfo.firstName} ${customerInfo.lastName}`,
          email: customerInfo.email,
          paymentProfiles: [],
        },
      },
    }

    const resp = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cimRequest),
    })
    const responseData = await safeParseResponse(resp)

    if (responseData.messages?.resultCode !== 'Ok') {
      const errMsg = responseData.messages?.message?.[0]?.text || 'Unknown error'
      return c.json({ success: false, error: `Authorize.Net error: ${errMsg}` }, 500)
    }

    const customerProfileId = responseData.customerProfileId

    // store to D1 if present
    try {
      if (c.env.DB) {
        const insert = `INSERT INTO customer_profiles (email, first_name, last_name, phone, address, city, state, zip_code, country, authorize_net_customer_profile_id, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        await c.env.DB.prepare(insert).bind(
          customerInfo.email,
          customerInfo.firstName,
          customerInfo.lastName,
          customerInfo.phone || null,
          customerInfo.address || null,
          customerInfo.city || null,
          customerInfo.state || null,
          customerInfo.zipCode || null,
          customerInfo.country || 'US',
          customerProfileId,
          new Date().toISOString()
        ).run()
      }
    } catch (dbErr) {
      console.warn('DB store profile error', String(dbErr))
    }

    return c.json({ success: true, customerProfileId, debug: debug ? { request: cimRequest, response: responseData } : undefined })
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500)
  }
})

// POST /get-customer-profile
app.post('/get-customer-profile', async (c) => {
  try {
    const { customerProfileId, debug = false } = await c.req.json()
    if (!customerProfileId) return c.json({ success: false, error: 'Customer Profile ID is required' }, 400)

    const apiLoginId = c.env.AUTHORIZE_NET_API_LOGIN_ID
    const transactionKey = c.env.AUTHORIZE_NET_TRANSACTION_KEY
    if (!apiLoginId || !transactionKey) return c.json({ success: false, error: 'Authorize.Net credentials not configured' }, 500)

    const apiRequest = {
      getCustomerProfileRequest: {
        merchantAuthentication: { name: apiLoginId, transactionKey },
        customerProfileId,
        unmaskExpirationDate: false,
        includeIssuerInfo: true,
      },
    }

    const resp = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(apiRequest)
    })
    const responseData = await safeParseResponse(resp)

    if (responseData.messages?.resultCode === 'Ok' && responseData.profile) {
      const profile = responseData.profile
      const paymentProfiles = (profile.paymentProfiles || []).map(pp => ({
        customerPaymentProfileId: pp.customerPaymentProfileId,
        cardNumber: pp.payment?.creditCard?.cardNumber || 'N/A',
        cardType: pp.payment?.creditCard?.cardType || 'Unknown',
        expirationDate: pp.payment?.creditCard?.expirationDate || 'XXXX',
        billTo: pp.billTo || null,
      }))
      const shippingAddresses = (profile.shipToList || []).map(addr => ({
        customerAddressId: addr.customerAddressId,
        firstName: addr.firstName,
        lastName: addr.lastName,
        address: addr.address,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country,
        phoneNumber: addr.phoneNumber,
      }))

      return c.json({ success: true, profile: { customerProfileId: profile.customerProfileId, merchantCustomerId: profile.merchantCustomerId, description: profile.description, email: profile.email, paymentProfiles, shippingAddresses }, debug: debug ? { request: apiRequest, response: responseData } : undefined })
    }

    const errMsg = responseData.messages?.message?.[0]?.text || 'Failed to fetch customer profile'
    return c.json({ success: false, error: errMsg, debug: debug ? { request: apiRequest, response: responseData } : undefined }, 400)
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500)
  }
})

// POST /get-hosted-profile-token
app.post('/get-hosted-profile-token', async (c) => {
  try {
    const body = await c.req.json()
    const { customerProfileId, pageType = 'manage', paymentProfileId, shippingAddressId, returnUrl, cancelUrl, displayMode = 'redirect', iframeCommunicatorUrl, debug = false } = body
    if (!customerProfileId) return c.json({ success: false, error: 'Customer Profile ID is required' }, 400)

    const apiLoginId = c.env.AUTHORIZE_NET_API_LOGIN_ID
    const transactionKey = c.env.AUTHORIZE_NET_TRANSACTION_KEY
    if (!apiLoginId || !transactionKey) return c.json({ success: false, error: 'Authorize.Net credentials not configured' }, 500)

    const referenceId = `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const finalReturnUrl = returnUrl ? `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}referenceId=${referenceId}` : undefined
    const finalCancelUrl = cancelUrl ? `${cancelUrl}${cancelUrl.includes('?') ? '&' : '?'}cancelled=true&referenceId=${referenceId}` : undefined

    const settings = []
    if (displayMode === 'redirect' && finalReturnUrl) {
      settings.push({ settingName: 'hostedProfileReturnUrl', settingValue: finalReturnUrl })
      settings.push({ settingName: 'hostedProfileReturnUrlText', settingValue: 'Continue' })
    }
    if ((displayMode === 'iframe' || displayMode === 'lightbox') && iframeCommunicatorUrl) {
      settings.push({ settingName: 'hostedProfileIFrameCommunicatorUrl', settingValue: iframeCommunicatorUrl })
    }
    settings.push({ settingName: 'hostedProfilePageBorderVisible', settingValue: displayMode === 'redirect' ? 'true' : 'false' })
    settings.push({ settingName: 'hostedProfileValidationMode', settingValue: 'testMode' })

    const tokenRequest = {
      getHostedProfilePageRequest: {
        merchantAuthentication: { name: apiLoginId, transactionKey },
        customerProfileId,
        hostedProfileSettings: { setting: settings },
      }
    }

    const resp = await fetch('https://apitest.authorize.net/xml/v1/request.api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tokenRequest) })
    const responseData = await safeParseResponse(resp)
    if (responseData.messages?.resultCode === 'Ok' && responseData.token) {
      const gatewayUrlMap = { manage: 'https://test.authorize.net/customer/manage', addPayment: 'https://test.authorize.net/customer/addPayment', editPayment: 'https://test.authorize.net/customer/manage', addShipping: 'https://test.authorize.net/customer/addShipping', editShipping: 'https://test.authorize.net/customer/manage' }
      const gatewayUrl = gatewayUrlMap[pageType] || gatewayUrlMap.manage
      return c.json({ success: true, token: responseData.token, gatewayUrl, referenceId, pageType, displayMode, debug: debug ? { request: tokenRequest, response: responseData, settings } : undefined })
    }
    const errMsg = responseData.messages?.message?.[0]?.text || 'Failed to generate token'
    return c.json({ success: false, error: errMsg, debug: debug ? { request: tokenRequest, response: responseData } : undefined }, 400)
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500)
  }
})

// POST /charge-customer-profile
app.post('/charge-customer-profile', async (c) => {
  try {
    const { customerProfileId, customerPaymentProfileId, amount, debug } = await c.req.json()
    const apiLoginId = c.env.AUTHORIZE_NET_API_LOGIN_ID
    const transactionKey = c.env.AUTHORIZE_NET_TRANSACTION_KEY
    if (!apiLoginId || !transactionKey) return c.json({ success: false, error: 'Authorize.Net credentials not configured' }, 500)

    const profileData = { customerProfileId }
    if (customerPaymentProfileId) profileData.paymentProfile = { paymentProfileId: customerPaymentProfileId }

    const transactionRequest = {
      createTransactionRequest: {
        merchantAuthentication: { name: apiLoginId, transactionKey },
        refId: `ref_${Date.now()}`,
        transactionRequest: { transactionType: 'authCaptureTransaction', amount: String(amount), profile: profileData }
      }
    }

    const resp = await fetch('https://apitest.authorize.net/xml/v1/request.api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transactionRequest) })
    const responseData = await safeParseResponse(resp)

    if (responseData.messages?.resultCode !== 'Ok') {
      const errMsg = responseData.messages?.message?.[0]?.text || 'Unknown error'
      return c.json({ success: false, error: `Authorize.Net error: ${errMsg}` }, 500)
    }

    const tx = responseData.transactionResponse
    if (tx?.responseCode !== '1') {
      const errMsg = tx?.errors?.[0]?.errorText || 'Transaction declined'
      return c.json({ success: false, error: errMsg }, 400)
    }

    return c.json({ success: true, transactionId: tx.transId, authCode: tx.authCode, accountNumber: tx.accountNumber, accountType: tx.accountType, debug: debug ? { request: transactionRequest, response: responseData } : undefined })
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500)
  }
})

export default app

// Helper to safely parse JSON responses that may include a leading BOM
async function safeParseResponse(resp) {
  const text = await resp.text()
  if (!text) return {}
  // Remove byte order mark if present
  const clean = text.replace(/^\uFEFF/, '')
  try {
    return JSON.parse(clean)
  } catch (err) {
    return { parseError: true, raw: clean }
  }
}
