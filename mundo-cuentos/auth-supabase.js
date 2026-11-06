(function(){
  const config=window.JUFANTICS_AUTH_CONFIG||{};
  const configured=Boolean(config.enabled&&config.supabaseUrl&&config.publishableKey);
  let client=null,state=null,bootPromise=null;
  const emit=()=>document.dispatchEvent(new CustomEvent('jufantics:remote-auth-changed',{detail:state}));
  const loadSdk=()=>new Promise((resolve,reject)=>{
    if(window.supabase?.createClient){resolve();return}
    const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';script.onload=resolve;script.onerror=()=>reject(new Error('No se pudo cargar el servicio de acceso.'));document.head.appendChild(script);
  });
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
    state={user:session.user,profile,household,hasAccess:Boolean(access)};emit();return state;
  }
  async function boot(){
    if(!configured)return null;
    await loadSdk();
    client=window.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    client.auth.onAuthStateChange(()=>setTimeout(()=>refresh().catch(error=>document.dispatchEvent(new CustomEvent('jufantics:remote-auth-error',{detail:error}))),0));
    return refresh();
  }
  const ready=()=>bootPromise||(bootPromise=boot());
  async function signIn(email,password){await ready();const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;return refresh()}
  async function signOut(){if(!client)return;const {error}=await client.auth.signOut();if(error)throw error;state=null;emit()}
  window.JufanticsRemoteAuth={configured,ready,refresh,signIn,signOut,snapshot:()=>state,client:()=>client};
  ready().catch(error=>document.dispatchEvent(new CustomEvent('jufantics:remote-auth-error',{detail:error})));
})();

