/* Public entry point. Authentication stays in Supabase; no secrets or tokens in URLs. */
(() => {
  const dialog=document.querySelector('#sign-in-card');
  const status=document.querySelector('#entry-status');
  const google=document.querySelector('#entry-google'),passkey=document.querySelector('#entry-passkey');
  const form=document.querySelector('#entry-request-form');
  let client,settings,initializing,busy=false,opener,pendingSession;
  const say=(message,error=false)=>{status.textContent=message;status.hidden=!message;status.dataset.error=String(error)};
  function setBusy(value){busy=value;dialog.setAttribute('aria-busy',String(value));dialog.querySelectorAll('button:not(.entry-close)').forEach(b=>b.disabled=value)}
  function showRequest(value){document.querySelector('#entry-login').hidden=value;form.hidden=!value;dialog.setAttribute('aria-labelledby',value?'entry-request-title':'entry-title');say('');(value?document.querySelector('#entry-name'):google).focus()}
  function open(){opener=document.activeElement;if(!dialog.open)dialog.showModal();}
  document.querySelector('a[href="#sign-in"]').addEventListener('click',e=>{e.preventDefault();open()});
  document.querySelector('.entry-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{opener?.focus();if(location.hash==='#sign-in')history.replaceState(null,'',location.pathname+location.search)});
  document.querySelector('#entry-request').onclick=()=>showRequest(true);
  document.querySelector('#entry-back').onclick=()=>showRequest(false);
  async function initialize(){
    if(client)return client;
    if(initializing)return initializing;
    initializing=(async()=>{
      const response=await fetch('/api/auth/config',{cache:'no-store'});
      if(!response.ok)throw Error('Sign-in is temporarily unavailable. Please try again.');
      settings=await response.json();
      if(settings.callbackUrl && new URL(settings.callbackUrl).origin!==location.origin)throw Error('Open the configured sign-in website to continue.');
      if(!settings.url||!settings.publishableKey)throw Error('Sign-in is not configured yet.');
      // Only the app origin receives a session; never accept a caller-provided redirect.
      if(settings.appOrigin!=='https://app.acetate.me' && !(location.hostname==='127.0.0.1'&&/^http:\/\/127\.0\.0\.1:\d+$/.test(settings.appOrigin)))throw Error('Sign-in settings could not be verified.');
      if(!window.supabase)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/vendor/supabase.js';script.onload=resolve;script.onerror=()=>reject(Error('Could not load sign-in. Please try again.'));document.head.append(script)});
      client=window.supabase.createClient(settings.url,settings.publishableKey,{auth:{flowType:'pkce',storage:sessionStorage,storageKey:'acetate-entry-auth',persistSession:true,autoRefreshToken:false,detectSessionInUrl:true,experimental:{passkey:true}}});
      return client;
    })();
    try{return await initializing}finally{initializing=null}
  }
  async function enterApp(session){
    if(!session?.access_token||!session?.refresh_token)throw Error('Sign-in did not complete. Please try again.');
    say('Opening your account…');
    await new Promise((resolve,reject)=>{
      const frame=document.createElement('iframe');frame.hidden=true;frame.title='Secure account connection';frame.src=settings.appOrigin+'/auth/receive';
      let nonce;
      const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);frame.remove()};
      const timer=setTimeout(()=>{cleanup();reject(Error('Could not open your account. Please try signing in again.'))},15000);
      function receive(event){
        if(event.origin!==settings.appOrigin||event.source!==frame.contentWindow)return;
        if(event.data?.type==='acetate-auth-ready'&&!nonce&&typeof event.data.nonce==='string'){
          nonce=event.data.nonce;frame.contentWindow.postMessage({type:'acetate-auth-session',nonce,access_token:session.access_token,refresh_token:session.refresh_token},settings.appOrigin);
        }else if(event.data?.nonce===nonce&&nonce&&event.data.type==='acetate-auth-complete'){
          cleanup();resolve();
        }else if(event.data?.nonce===nonce&&nonce&&event.data.type==='acetate-auth-error'){
          cleanup();reject(Error('This account does not have access yet. You can request an invitation.'));
        }
      }
      window.addEventListener('message',receive);document.body.append(frame);
    });
    sessionStorage.removeItem('acetate-entry-auth');
    sessionStorage.removeItem('acetate-entry-auth-code-verifier');
    location.assign(settings.appOrigin+'/');
  }
  async function afterGoogle(session){
    // Authorization is checked before offering enrollment and again during handoff.
    const response=await fetch('/api/auth/authorize',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
    if(!response.ok)throw Error('This account does not have access yet. You can request an invitation.');
    if(!settings.passkeysEnabled||!window.isSecureContext||!window.PublicKeyCredential)return enterApp(session);
    const {data,error}=await client.auth.passkey.list();
    if(error||data?.length)return enterApp(session);
    pendingSession=session;
    document.querySelector('#entry-login').hidden=true;
    form.hidden=true;
    document.querySelector('#entry-enroll').hidden=false;
    dialog.setAttribute('aria-labelledby','entry-enroll-title');
    setBusy(false);say('');document.querySelector('#entry-create-passkey').focus();
  }
  document.querySelector('#entry-create-passkey').onclick=async()=>{
    if(busy||!pendingSession)return;setBusy(true);say('Follow the prompt on your device…');
    try{
      const {error}=await client.auth.registerPasskey();if(error)throw error;
      // A fresh session may have been issued while the device prompt was open.
      const {data}=await client.auth.getSession();
      await enterApp(data.session||pendingSession);
    }catch{say('Passkey setup did not finish. Try again or choose Not now.',true)}
    finally{setBusy(false)}
  };
  document.querySelector('#entry-skip-passkey').onclick=async()=>{
    if(busy||!pendingSession)return;setBusy(true);
    try{await enterApp(pendingSession)}catch{say('Could not open your account. Please try again.',true)}finally{setBusy(false)}
  };
  google.onclick=async()=>{
    if(busy)return;setBusy(true);say('Connecting to Google…');
    try{const auth=await initialize();const {error}=await auth.auth.signInWithOAuth({provider:'google',options:{redirectTo:settings.callbackUrl||new URL('/?auth=callback',location.origin).href}});if(error)throw error}
    catch{say('Google sign-in could not start. Please try again.',true);setBusy(false)}
  };
  passkey.onclick=async()=>{
    if(busy)return;
    if(!window.isSecureContext||!window.PublicKeyCredential){say('Passkeys are not available in this browser. Continue with Google instead.',true);return}
    setBusy(true);say('Use your device to sign in…');
    try{
      const auth=await initialize();
      if(!settings.passkeysEnabled){say('Passkey sign-in is not enabled yet. Continue with Google.',true);return}
      const {data,error}=await auth.auth.signInWithPasskey();if(error)throw error;
      await enterApp(data.session);
    }catch(error){say(error.name==='NotAllowedError'||error.code==='ERROR_CEREMONY_ABORTED'?'Passkey sign-in was cancelled. You can try again.':'Could not sign in with a passkey. Try again or continue with Google.',true)}
    finally{setBusy(false)}
  };
  form.onsubmit=async e=>{
    e.preventDefault();if(busy||!form.reportValidity())return;
    const name=form.elements.name.value.trim(),email=form.elements.email.value.trim();
    if(!name){form.elements.name.setCustomValidity('Enter your name.');form.elements.name.reportValidity();return}
    setBusy(true);say('Sending your request…');
    try{
      const response=await fetch('/api/request-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email})});
      if(!response.ok)throw Error();
      form.reset();say('Request received. We’ll email you about access.');
    }catch{say('Your request could not be sent. Please try again.',true)}finally{setBusy(false)}
  };
  form.elements.name.addEventListener('input',()=>form.elements.name.setCustomValidity(''));
  if(location.hash==='#sign-in')open();
  if(new URLSearchParams(location.search).get('auth')==='callback'){
    open();setBusy(true);say('Completing sign-in…');
    (async()=>{try{
      const url=new URL(location.href);if(url.searchParams.has('error'))throw Error();
      const auth=await initialize();const {data,error}=await auth.auth.getSession();
      history.replaceState(null,'','/#sign-in');
      if(error||!data.session)throw Error();await afterGoogle(data.session);
    }catch{history.replaceState(null,'','/#sign-in');say('Sign-in could not be completed. Please try again.',true);setBusy(false)}})();
  }
})();
