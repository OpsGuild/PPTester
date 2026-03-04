// ──────────────── State ────────────────
var piInitialized = false;
var piUser = null;
var currentReference = null;
var currentPiPaymentId = null;

// ──────────────── Config Management ────────────────
var STORAGE_KEY = 'pi_tester_configs';
var ACTIVE_CONFIG_KEY = 'pi_tester_active';
var ENDPOINTS = ['approve', 'complete', 'verify', 'cancel', 'status'];
var VARS = ['piPaymentId', 'reference', 'txid'];

function getConfigs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
}
function saveConfigs(configs) { localStorage.setItem(STORAGE_KEY, JSON.stringify(configs)); }
function getActiveConfigName() { return localStorage.getItem(ACTIVE_CONFIG_KEY) || ''; }
function setActiveConfigName(name) { localStorage.setItem(ACTIVE_CONFIG_KEY, name); }

function val(id) {
  var el = document.getElementById(id);
  return el ? (el.value || '').trim() : '';
}
function setVal(id, v) {
  var el = document.getElementById(id);
  if (el && v !== undefined && v !== null) el.value = v;
}
function isChecked(id) {
  var el = document.getElementById(id);
  return el ? el.checked : false;
}
function setChecked(id, v) {
  var el = document.getElementById(id);
  if (el) el.checked = !!v;
}

function readEndpointConfig(ep) {
  var cfg = { route: val('ep_' + ep + '_route'), extra: val('ep_' + ep + '_extra'), vars: {} };
  if (ep === 'status') cfg.method = val('ep_status_method');
  VARS.forEach(function(v) {
    cfg.vars[v] = {
      on: isChecked('ep_' + ep + '_var_' + v + '_on'),
      loc: val('ep_' + ep + '_var_' + v + '_loc'),
      key: val('ep_' + ep + '_var_' + v + '_key'),
    };
  });
  return cfg;
}

function applyEndpointConfig(ep, cfg) {
  if (!cfg) return;
  setVal('ep_' + ep + '_route', cfg.route);
  setVal('ep_' + ep + '_extra', cfg.extra);
  if (ep === 'status' && cfg.method) setVal('ep_status_method', cfg.method);
  if (cfg.vars) {
    VARS.forEach(function(v) {
      if (cfg.vars[v]) {
        setChecked('ep_' + ep + '_var_' + v + '_on', cfg.vars[v].on);
        setVal('ep_' + ep + '_var_' + v + '_loc', cfg.vars[v].loc);
        setVal('ep_' + ep + '_var_' + v + '_key', cfg.vars[v].key);
      }
    });
  }
}

function readConfigFromForm() {
  var cfg = {
    baseUrl: val('cfgBaseUrl'),
    accessToken: val('cfgAccessToken'),
    authType: val('cfgAuthType'),
    customHeader: val('cfgCustomHeader'),
    initRoute: val('ep_init_route'),
    initPayload: val('initPayload'),
    responseRefPath: val('cfgResponseRefPath'),
    responseStatusPath: val('cfgResponseStatusPath'),
    piAmount: val('piAmount'),
    piMemo: val('piMemo'),
    endpoints: {},
  };
  ENDPOINTS.forEach(function(ep) { cfg.endpoints[ep] = readEndpointConfig(ep); });
  return cfg;
}

function applyConfigToForm(cfg) {
  setVal('cfgBaseUrl', cfg.baseUrl);
  setVal('cfgAccessToken', cfg.accessToken);
  setVal('cfgAuthType', cfg.authType || 'bearer');
  setVal('cfgCustomHeader', cfg.customHeader);
  setVal('ep_init_route', cfg.initRoute || '/payments/initialize');
  if (cfg.initPayload) setVal('initPayload', cfg.initPayload);
  setVal('cfgResponseRefPath', cfg.responseRefPath || 'data.reference');
  setVal('cfgResponseStatusPath', cfg.responseStatusPath || 'data.status');
  if (cfg.piAmount) setVal('piAmount', cfg.piAmount);
  if (cfg.piMemo) setVal('piMemo', cfg.piMemo);
  if (cfg.endpoints) {
    ENDPOINTS.forEach(function(ep) { applyEndpointConfig(ep, cfg.endpoints[ep]); });
  }
  onAuthTypeChange();
}

function saveCurrentConfig() {
  var name = prompt('Save config as:');
  if (!name) return;
  var configs = getConfigs();
  configs[name] = readConfigFromForm();
  saveConfigs(configs);
  setActiveConfigName(name);
  renderConfigChips();
  log('Config "' + name + '" saved', 'success');
}

function loadConfig(name) {
  var configs = getConfigs();
  if (!configs[name]) return;
  applyConfigToForm(configs[name]);
  setActiveConfigName(name);
  renderConfigChips();
  log('Loaded config "' + name + '"', 'info');
}

function deleteConfig(name, evt) {
  evt.stopPropagation();
  if (!confirm('Delete config "' + name + '"?')) return;
  var configs = getConfigs();
  delete configs[name];
  saveConfigs(configs);
  if (getActiveConfigName() === name) setActiveConfigName('');
  renderConfigChips();
  log('Deleted config "' + name + '"', 'warn');
}

function renderConfigChips() {
  var el = document.getElementById('savedConfigs');
  var configs = getConfigs();
  var active = getActiveConfigName();
  var names = Object.keys(configs);
  if (names.length === 0) {
    el.innerHTML = '<span style="font-size:12px;color:var(--text-dim)">No saved configs yet</span>';
    return;
  }
  el.innerHTML = names.map(function(n) {
    return '<span class="config-chip' + (n === active ? ' active' : '') + '" onclick="loadConfig(\'' + n.replace(/'/g, "\\'") + '\')">'
      + n + '<span class="delete" onclick="deleteConfig(\'' + n.replace(/'/g, "\\'") + '\', event)">&times;</span></span>';
  }).join('');
}

// ──────────────── Auth ────────────────
function onAuthTypeChange() {
  var type = val('cfgAuthType');
  document.getElementById('customHeaderField').style.display = type === 'custom' ? '' : 'none';
}

function buildAuthHeaders() {
  var token = val('cfgAccessToken');
  var type = val('cfgAuthType');
  var headers = {};
  switch (type) {
    case 'apikey': headers['X-API-Key'] = token; break;
    case 'basic': headers['Authorization'] = 'Basic ' + token; break;
    case 'custom': headers[val('cfgCustomHeader') || 'Authorization'] = token; break;
    default: headers['Authorization'] = 'Bearer ' + token; break;
  }
  return headers;
}

// ──────────────── Collapsible ────────────────
function toggleSection(id) {
  var body = document.getElementById(id);
  var arrow = document.getElementById(id + 'Arrow');
  if (body.classList.contains('hidden')) {
    body.classList.remove('hidden');
    if (arrow) arrow.classList.add('open');
  } else {
    body.classList.add('hidden');
    if (arrow) arrow.classList.remove('open');
  }
}

// ──────────────── Logging ────────────────
function log(msg, type, data) {
  type = type || 'info';
  var el = document.getElementById('log');
  var time = new Date().toLocaleTimeString();
  var html = '<div class="log-entry"><span class="log-time">[' + time + ']</span> <span class="log-' + type + '">' + escapeHtml(msg) + '</span>';
  if (data) {
    var str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    html += '<span class="log-data">' + escapeHtml(str) + '</span>';
  }
  html += '</div>';
  el.innerHTML += html;
  el.scrollTop = el.scrollHeight;
}
function escapeHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function clearLog() { document.getElementById('log').innerHTML = ''; }

// ──────────────── Steps ────────────────
function setStep(n, state) {
  var el = document.getElementById('step' + n);
  el.className = 'step';
  if (state) el.classList.add(state);
}
function resetSteps() { for (var i = 1; i <= 5; i++) setStep(i, ''); }

// ──────────────── SDK Status ────────────────
function showSdkStatus(msg, type) {
  var el = document.getElementById('sdkStatus');
  el.className = 'status-bar ' + type;
  el.classList.remove('hidden');
  var colors = { info: 'blue', success: 'green', error: 'red', warning: 'yellow' };
  el.innerHTML = '<div class="dot ' + (colors[type] || 'blue') + '"></div><span>' + msg + '</span>';
}

// ──────────────── Helpers ────────────────
function deepGet(obj, path) {
  if (!path || !obj) return undefined;
  var parts = path.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}

function buildRequest(epName, runtimeVars) {
  var epCfg = readEndpointConfig(epName);
  var method = epCfg.method || 'POST';
  var route = epCfg.route;
  var body = {};
  var queryParams = [];

  // Parse extra body fields
  if (epCfg.extra) {
    try {
      var extra = JSON.parse(epCfg.extra);
      for (var k in extra) { if (extra.hasOwnProperty(k)) body[k] = extra[k]; }
    } catch (e) {
      log('Invalid extra body JSON for ' + epName + ': ' + e.message, 'error');
    }
  }

  // Apply variable mappings
  VARS.forEach(function(v) {
    var mapping = epCfg.vars[v];
    if (!mapping || !mapping.on || !mapping.key) return;
    var value = runtimeVars[v];
    if (value === undefined || value === null) return;

    switch (mapping.loc) {
      case 'body':
        body[mapping.key] = value;
        break;
      case 'query':
        queryParams.push(encodeURIComponent(mapping.key) + '=' + encodeURIComponent(value));
        break;
      case 'url':
        route = route.replace(/\/?$/, '/' + encodeURIComponent(value));
        break;
    }
  });

  var url = route;
  if (queryParams.length > 0) url += '?' + queryParams.join('&');

  var hasBody = Object.keys(body).length > 0;
  return { method: method, url: url, body: hasBody ? body : null };
}

// ──────────────── API Helper ────────────────
async function api(method, endpoint, body) {
  var baseUrl = val('cfgBaseUrl');
  if (!baseUrl) throw new Error('Base URL is required');
  if (!val('cfgAccessToken')) throw new Error('Access token is required');

  var url = baseUrl.replace(/\/+$/, '') + endpoint;
  var headers = Object.assign({ 'Content-Type': 'application/json' }, buildAuthHeaders());
  var opts = { method: method, headers: headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  log(method + ' ' + endpoint, 'info', body ? JSON.stringify(body) : null);

  var res = await fetch(url, opts);
  var json = await res.json();

  if (!res.ok) {
    log('ERR ' + res.status + ' — ' + (json.message || json.error || JSON.stringify(json)), 'error');
    throw new Error(json.message || json.error || 'API Error ' + res.status);
  }

  log('OK ' + res.status, 'success', JSON.stringify(json));
  return json;
}

async function callEndpoint(epName, runtimeVars) {
  var req = buildRequest(epName, runtimeVars);
  return await api(req.method, req.url, req.body);
}

// ──────────────── Pi SDK Init ────────────────
async function initPiSdk() {
  var mode = val('piSdkMode');
  var sandbox = mode.includes('Testnet');
  log('Initializing Pi SDK in ' + (sandbox ? 'SANDBOX' : 'PRODUCTION') + ' mode...', 'warn');
  showSdkStatus('Initializing...', 'warning');
  try {
    await Pi.init({ version: '2.0', sandbox: sandbox });
    piInitialized = true;
    showSdkStatus('Pi SDK ready (' + (sandbox ? 'Testnet' : 'Mainnet') + ')', 'success');
    log('Pi SDK initialized', 'success');
    document.getElementById('btnAuth').disabled = false;
    document.getElementById('btnInit').textContent = 'SDK Initialized';
    document.getElementById('btnInit').disabled = true;
  } catch (err) {
    showSdkStatus('SDK init failed: ' + err.message, 'error');
    log('SDK init failed: ' + err.message, 'error');
  }
}

// ──────────────── Pi Auth ────────────────
async function authenticatePi() {
  if (!piInitialized) return log('Initialize Pi SDK first', 'error');
  log('Requesting Pi authentication...', 'info');
  try {
    var scopes = ['payments', 'username'];
    var authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);
    piUser = authResult.user;
    document.getElementById('piUsername').textContent = piUser.username || '--';
    document.getElementById('piUid').textContent = piUser.uid || '--';
    document.getElementById('piUser').classList.remove('hidden');
    log('Authenticated as ' + piUser.username + ' (uid: ' + piUser.uid + ')', 'success');
    document.getElementById('btnAuth').textContent = 'Authenticated: ' + piUser.username;
    document.getElementById('btnAuth').disabled = true;
  } catch (err) {
    log('Pi auth failed: ' + err.message, 'error');
  }
}

function onIncompletePaymentFound(payment) {
  log('Incomplete payment found!', 'warn', JSON.stringify(payment));
  currentPiPaymentId = payment.identifier;
  document.getElementById('manualPiId').value = payment.identifier;
  if (payment.transaction && payment.transaction.txid) {
    document.getElementById('manualTxId').value = payment.transaction.txid;
  }
}

// ──────────────── Full Payment Flow ────────────────
async function startPayment() {
  if (!piInitialized) return log('Initialize Pi SDK first', 'error');

  var amount = parseFloat(val('piAmount'));
  var memo = val('piMemo');
  var payloadRaw = val('initPayload');
  var initRoute = val('ep_init_route');
  var refPath = val('cfgResponseRefPath');

  if (!amount || amount <= 0) return log('Enter a valid Pi SDK amount', 'error');
  if (!val('cfgAccessToken')) return log('Enter your access token', 'error');
  if (!val('cfgBaseUrl')) return log('Enter your base URL', 'error');

  var initBody;
  try {
    initBody = JSON.parse(payloadRaw);
  } catch (e) {
    return log('Invalid JSON in init payload: ' + e.message, 'error');
  }

  resetSteps();
  document.getElementById('paymentResult').classList.add('hidden');
  document.getElementById('btnPay').disabled = true;
  document.getElementById('btnPay').textContent = 'Processing...';

  try {
    // Step 1: Initialize payment on backend
    setStep(1, 'active');
    log('Step 1/5: Initializing payment on backend...', 'info');

    var initRes = await api('POST', initRoute, initBody);
    currentReference = deepGet(initRes, refPath);

    if (!currentReference) throw new Error('No reference found at path: ' + refPath);

    document.getElementById('resRef').textContent = currentReference;
    document.getElementById('manualRef').value = currentReference;
    setStep(1, 'done');
    log('Reference: ' + currentReference, 'success');

    // Step 2: Create Pi SDK payment
    setStep(2, 'active');
    log('Step 2/5: Opening Pi SDK payment dialog...', 'info');

    var piPaymentData = {
      amount: amount,
      memo: memo + ' [ref:' + currentReference + ']',
      metadata: { reference: currentReference },
    };

    var runtimeVars = { reference: currentReference, piPaymentId: '', txid: '' };

    var piCallbacks = {
      onReadyForServerApproval: function(paymentId) {
        currentPiPaymentId = paymentId;
        runtimeVars.piPaymentId = paymentId;
        document.getElementById('resPiId').textContent = paymentId;
        document.getElementById('manualPiId').value = paymentId;
        setStep(2, 'done');
        setStep(3, 'active');
        log('Step 3/5: Approving (piPaymentId: ' + paymentId + ')...', 'info');

        callEndpoint('approve', runtimeVars).then(function() {
          setStep(3, 'done');
          log('Payment approved', 'success');
        }).catch(function(err) {
          setStep(3, 'error');
          log('Approve failed: ' + err.message, 'error');
        });
      },

      onReadyForServerCompletion: function(paymentId, txid) {
        runtimeVars.piPaymentId = paymentId;
        runtimeVars.txid = txid;
        document.getElementById('resTxId').textContent = txid || '--';
        document.getElementById('manualTxId').value = txid || '';
        setStep(4, 'active');
        log('Step 4/5: Completing (txid: ' + txid + ')...', 'info');

        callEndpoint('complete', runtimeVars)
          .then(function() {
            setStep(4, 'done');
            log('Payment completed', 'success');
            setStep(5, 'active');
            log('Step 5/5: Verifying...', 'info');
            return callEndpoint('verify', runtimeVars);
          })
          .then(function(verifyRes) {
            var statusPath = val('cfgResponseStatusPath');
            var status = deepGet(verifyRes, statusPath) || 'unknown';
            setStep(5, 'done');
            updateResultStatus(status);
            log('Verified — status: ' + status, 'success');
            document.getElementById('paymentResult').classList.remove('hidden');
            document.getElementById('btnPay').textContent = 'Payment Complete';
          })
          .catch(function(err) {
            setStep(5, 'error');
            log('Verify failed: ' + err.message, 'error');
            resetPayButton();
          });
      },

      onCancel: function(paymentId) {
        log('Payment cancelled by user', 'warn');
        setStep(2, 'error');
        resetPayButton();
        runtimeVars.piPaymentId = paymentId;
        callEndpoint('cancel', runtimeVars).catch(function() {});
      },

      onError: function(err, payment) {
        log('Pi SDK error: ' + (err.message || err), 'error', payment ? JSON.stringify(payment) : null);
        resetPayButton();
      },
    };

    Pi.createPayment(piPaymentData, piCallbacks);

  } catch (err) {
    log('Payment flow error: ' + err.message, 'error');
    resetPayButton();
  }
}

function resetPayButton() {
  document.getElementById('btnPay').disabled = false;
  document.getElementById('btnPay').textContent = 'Pay with Pi';
}

function updateResultStatus(status) {
  var el = document.getElementById('resStatus');
  var s = String(status).toLowerCase();
  var map = {
    successful: ['Successful', 'tag-green'],
    success: ['Successful', 'tag-green'],
    completed: ['Completed', 'tag-green'],
    failed: ['Failed', 'tag-red'],
    cancelled: ['Cancelled', 'tag-red'],
    initialized: ['Initialized', 'tag-gold'],
    pending: ['Pending', 'tag-gold'],
  };
  var entry = map[s] || [status, 'tag-purple'];
  el.innerHTML = '<span class="tag ' + entry[1] + '">' + entry[0] + '</span>';
}

// ──────────────── Manual Controls ────────────────
function getManualVars() {
  return {
    reference: val('manualRef'),
    piPaymentId: val('manualPiId'),
    txid: val('manualTxId'),
  };
}

async function manualApprove() {
  var v = getManualVars();
  if (!v.piPaymentId) return log('Pi Payment ID required', 'error');
  if (!v.reference) return log('Reference required', 'error');
  try { await callEndpoint('approve', v); } catch (e) {}
}

async function manualComplete() {
  var v = getManualVars();
  if (!v.piPaymentId) return log('Pi Payment ID required', 'error');
  if (!v.txid) return log('TX ID required', 'error');
  try { await callEndpoint('complete', v); } catch (e) {}
}

async function manualVerify() {
  var v = getManualVars();
  if (!v.reference) return log('Reference required', 'error');
  try {
    var res = await callEndpoint('verify', v);
    var status = deepGet(res, val('cfgResponseStatusPath')) || 'unknown';
    updateResultStatus(status);
    document.getElementById('paymentResult').classList.remove('hidden');
  } catch (e) {}
}

async function manualCancel() {
  var v = getManualVars();
  if (!v.piPaymentId) return log('Pi Payment ID required', 'error');
  try { await callEndpoint('cancel', v); } catch (e) {}
}

async function manualGetStatus() {
  var v = getManualVars();
  if (!v.piPaymentId && !v.reference) return log('Pi Payment ID or Reference required', 'error');
  try { await callEndpoint('status', v); } catch (e) {}
}

// ──────────────── Startup ────────────────
function init() {
  renderConfigChips();
  var activeName = getActiveConfigName();
  var configs = getConfigs();
  if (activeName && configs[activeName]) {
    applyConfigToForm(configs[activeName]);
  }
  onAuthTypeChange();
  log('Pi Payment Tester loaded', 'info');
  log('Configure your backend connection and endpoints, then initialize the Pi SDK', 'info');
}

init();
