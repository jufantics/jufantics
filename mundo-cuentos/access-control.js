(function(){
  const ACCOUNT_KEY='jufantics_family_test_v1';
  function account(){try{return JSON.parse(localStorage.getItem(ACCOUNT_KEY)||'null')}catch{return null}}
  function expiresAt(value){
    if(!value?.created)return null;
    const date=new Date(value.created);if(Number.isNaN(date.getTime()))return null;
    value.plan?.startsWith('monthly')?date.setMonth(date.getMonth()+1):date.setFullYear(date.getFullYear()+1);
    return date;
  }
  function hasActiveAccount(){
    if(window.JufanticsRemoteAuth?.configured)return Boolean(window.JufanticsRemoteAuth.snapshot()?.hasAccess);
    const value=account();if(value?.status!=='active-test')return false;
    const expiry=expiresAt(value);return !expiry||expiry.getTime()>Date.now();
  }
  const tier=story=>story?.access||(story?.free?'free':'premium');
  const canOpen=story=>tier(story)==='free'||hasActiveAccount();
  const prepare=async()=>{if(window.JufanticsRemoteAuth?.configured)await window.JufanticsRemoteAuth.ready();return hasActiveAccount()};
  function requireStory(story){
    if(canOpen(story))return true;
    alert('Este cuento y sus actividades requieren una cuenta familiar activa.');
    location.replace('index.html#biblioteca');return false;
  }
  window.JufanticsAccess={account,hasActiveAccount,tier,canOpen,requireStory,prepare};
})();
