(function(){
 if(sessionStorage.getItem("isLoggedIn")!=="true"){ window.location.replace("login.html"); return; }
 const logout=document.getElementById("logoutBtn"); if(logout) logout.addEventListener("click",function(){sessionStorage.removeItem("isLoggedIn");window.location.replace("login.html");});
})();
