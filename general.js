function initHistory() {
    
    userData = JSON.parse(localStorage.getItem("userData")) || {
        Topics: [],
        UserNotes: [],
        JN: []
    };

    const sideNav = document.getElementById("mySidenav");
    const sideBottom = document.getElementById("appIcon");
    
    const start = Math.max(0, userData.Topics.length - 5);

    for (let i = start; i < userData.Topics.length; i++) {
        const link = document.createElement("a");
        link.href = "javascript:void(0)";
        link.textContent = userData.Topics[i];
        link.onclick = () => navHistory(i);
        sideNav.appendChild(link);
    }
    if (userData.Topics.length > 5) {
        userData.Topics.splice(0, userData.Topics.length - 5);
        userData.UserNotes.splice(0, userData.UserNotes.length - 5);
        userData.JN.splice(0, userData.JN.length - 5);
    }

    // Restore saved note text if you have a noteBox
    if (typeof nb !== "undefined" && nb !== null) {
        nb.value = userData.UserNotes || "";
    }

    console.log("History restored:", userData);
}

function openNav() {
  document.getElementById("mySidenav").style.width = "200px";
  document.getElementById("main").style.marginLeft = "200px";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}