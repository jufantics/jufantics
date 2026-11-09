(function(){
  const config=window.JUFANTICS_AUTH_CONFIG||{};
  const configured=Boolean(config.enabled&&config.supabaseUrl&&config.publishableKey);
  let client=null,state=null,bootPromise=null,recoveryMode=false;
  const accountUrl=config.accountUrl||new URL('cuenta.html',location.href).href.split('#')[0];
  const moduleUrl=document.currentScript?.src||new URL('auth-supabase.js',location.href).href;
  const localSdkUrl=new URL('vendor/supabase-2.119.0.min.js',moduleUrl).href;
  const emit=()=>document.dispatchEvent(new CustomEvent('jufantics:remote-auth-changed',{detail:state}));
  const loadScript=(src,timeout)=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const done=callback=>{clearTimeout(timer);script.onload=null;script.onerror=null;callback()};
    const timer=setTimeout(()=>{script.remove();done(()=>reject(new Error('Tiempo de espera agotado.')))},timeout);
    script.src=src;script.async=true;
    script.onload=()=>done(resolve);
    script.onerror=()=>done(()=>reject(new Error('No se pudo cargar el cliente.')));
    document.head.appendChild(script);
  });
  const loadSdk=async()=>{
    if(window.supabase?.createClient)return;
    try{await loadScript(localSdkUrl,4000)}catch{await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.min.js',8000)}
    if(!window.supabase?.createClient)throw new Error('El servicio de acceso no respondió. La lectura gratuita sigue disponible.');
  };
  async function refresh(){
    if(!client)return null;
    const {data:{session}}=await client.auth.getSession();
    if(!session){state=null;emit();return null}
    const [{data:profile,error:profileError},{data:household,error:householdError},{data:access,error:accessError}]=await Promise.all([
      client.from('profiles').select('user_id,role,display_name').eq('user_id',session.user.id).single(),
      client.from('households').select('id,plan,profile_limit,status,regular_price_pen,discount_pen,total_paid_pen,starts_at,expires_at,child_profiles(id,alias,active)').eq('owner_user_id',session.user.id).maybeSingle(),
      client.rpc('jufantics_has_active_access')
    ]);
    if(profileError)throw profileError;if(householdError)throw householdError;if(accessError)throw accessError;
    state={user:session.user,profile,household,hasAccess:Boolean(access),recoveryMode};emit();return state;
  }
  async function boot(){
    if(!configured)return null;
    if(client)return refresh();
    await loadSdk();
    client=window.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    client.auth.onAuthStateChange(event=>{
      recoveryMode=event==='PASSWORD_RECOVERY'||recoveryMode&&event!=='SIGNED_OUT';
      if(event==='SIGNED_OUT')recoveryMode=false;
      setTimeout(()=>refresh().catch(error=>document.dispatchEvent(new CustomEvent('jufantics:remote-auth-error',{detail:error}))),0);
    });
    return refresh();
  }
  const ready=()=>bootPromise||(bootPromise=boot().catch(error=>{bootPromise=null;throw error}));
  async function signIn(email,password){await ready();const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;return refresh()}
  async function signOut(){if(!client)return;const {error}=await client.auth.signOut();if(error)throw error;state=null;emit()}
  async function signUp(displayName,email,password){
    await ready();
    const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:displayName},emailRedirectTo:accountUrl}});
    if(error)throw error;return data;
  }
  async function resetPassword(email){await ready();const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:accountUrl});if(error)throw error}
  async function updatePassword(password){await ready();const {error}=await client.auth.updateUser({password});if(error)throw error;recoveryMode=false;return refresh()}
  async function addChildProfile(alias){
    await ready();const household=state?.household;if(!household)throw new Error('La cuenta todavía no tiene un plan familiar.');
    const {error}=await client.from('child_profiles').insert({household_id:household.id,alias});if(error)throw error;return refresh();
  }
  async function removeChildProfile(id){await ready();const {error}=await client.from('child_profiles').delete().eq('id',id);if(error)throw error;return refresh()}
  async function requestPlan(plan){await ready();const {data,error}=await client.rpc('jufantics_request_plan',{requested_plan:plan});if(error)throw error;return data}
  async function listAccounts(){await ready();const {data,error}=await client.rpc('jufantics_admin_accounts');if(error)throw error;return data||[]}
  async function adminSetSubscription(userId,plan,status,paymentAmount,verificationReference){
    await ready();const {data,error}=await client.rpc('jufantics_admin_set_subscription',{target_user:userId,target_plan:plan,target_status:status,payment_amount:paymentAmount,verification_reference:verificationReference});if(error)throw error;return data;
  }
  window.JufanticsRemoteAuth={configured,ready,refresh,signIn,signOut,signUp,resetPassword,updatePassword,addChildProfile,removeChildProfile,requestPlan,listAccounts,adminSetSubscription,snapshot:()=>state,client:()=>client};
  ready().catch(error=>document.dispatchEvent(new CustomEvent('jufantics:remote-auth-error',{detail:error})));
})();
