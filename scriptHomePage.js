const outputEl = document.getElementById("output");
const initBtn = document.getElementById("initBtn");
const startBtn = document.getElementById("startBtn");
const pmt = document.getElementById("promptBox");

const noteBtn = document.getElementById("noteBtn");
const nb = document.getElementById("notes");

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


function renderJotNotes(jotNotes) {
    const lines = jotNotes.split("\n");
    let html = "";
    let inList = false;

    lines.forEach(line => {
        line = line.trim();
        if (!line) return; // skip empty lines

        // Headings
        if (line.startsWith("## ")) {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<h3 style="margin-top:1em;color:#2c3e50;">${line.slice(3)}</h3>`;
        } else if (line.startsWith("# ")) {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<h2 style="margin-top:1.2em;color:#1a1a1a;">${line.slice(2)}</h2>`;
        }
        // Bullets
        else if (line.startsWith("*") || line.startsWith("-")) {
            if (!inList) { html += "<ul style='margin-left:1.2em;'>"; inList = true; }
            // Inline code/formulas
            line = line.replace(/`([^`]+)`/g, "<code style='background:#f0f0f0;padding:2px 4px;border-radius:3px;'>$1</code>");
            // Bold
            line = line.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
            // Italic
            line = line.replace(/\*(.*?)\*/g, "<i>$1</i>");
            html += `<li style="margin:0.3em 0;">${line.slice(1).trim()}</li>`;
        }
        // Plain paragraph
        else {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<p style="margin:0.5em 0;">${line}</p>`;
        }
    });

    if (inList) html += "</ul>";

    return html;
}

init = false;
userTopics = [];
let session = null;
let jotNotes = null;
let userData = JSON.parse(localStorage.getItem("userData")) || {
    Topics: [],
    UserNotes: [],
    JN: []
};

initBtn.addEventListener("click",async() => {
    let availability = await LanguageModel.availability();
    while (availability !== "available"){
        outputEl.textContent = "Checking if Prompt API is available...";
        if (availability == "unavailable"){
            outputEl.textContent = "Prompt API is unavailable :(";
            return;
        } else if( availability === "downloadable" || availability === "downloading"){
            outputEl.textContent = "Downloading Prompt API...";
        }
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update availability
        availability = await LanguageModel.availability();
    }
    outputEl.textContent = "Prompt API available. Creating session..."
    // Create session with output language
    session = await LanguageModel.create({
        initialPrompts:[
            {
                role:'system',
                content:'You are a knowledgable researcher',
            },
            {   role: 'assistant', 
                content: 'In a short jot note, you will search and give a list of key subtopics related to the topic that I want to explore. Use bullet points and single-colored text, short phrases only, include only short definitions. Ignore minor details and examples.',
            },
        ],
        expectedInputs: [
            { type: "text", languages: ["en"] }
        ],
        expectedOutputs: [
            { type: "text", languages: ["en"] }
        ]
    });
    init = true;
    if (init){
        outputEl.textContent = "Session Created! \nWrite down topics you want to explore :)";
        initBtn.style.display = "none";
        pmt.placeholder = "Your topic goes here :)";
        return;
    }
})

async function handleSubmit() {
    if (initBtn.style.display !== "none"){
        outputEl.innerHTML = "You have to instantiate the Prompt API before using this application :)";
        return;
    }
    if (pmt.value === "Your topic goes here :)" || pmt.value.trim() === "") {
        outputEl.innerHTML = "Please Enter a recognizable topic";
        return;
    }
    outputEl.textContent = "Digesting... :)";
    const reply = await session.prompt(pmt.value);
    userData.Topics.push(pmt.value);
    jotNotes = reply.content || reply;
    userData.JN.push(jotNotes);

    // Convert bullet points starting with '-', '*', or '•' into <li>
    const formatted = renderJotNotes(jotNotes);
    outputEl.innerHTML = formatted;
    const chatHistory = document.createElement('a');
    chatHistory.href = "#";
    chatHistory.textContent = pmt.value;

    const sidenav = document.getElementById("mySidenav");
    const chatHead = document.getElementById("chatHeader");
    
    const index = userData.Topics.length-1;
    chatHistory.onclick = () => navHistory(index);
    sidenav.insertBefore(chatHistory, chatHead.nextSibling);

    localStorage.setItem("userData", JSON.stringify(userData))
    console.log("Current userData:", userData);

}

function navHistory(index){
    console.log("clicked", index);
    console.log("rendered:", renderJotNotes(userData.JN[index]));
    outputEl.innerHTML = `<ul>${renderJotNotes(userData.JN[index])}</ul>`;
    nb.innerHTML = userData.UserNotes[index];
}

startBtn.addEventListener("click", handleSubmit);

pmt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); // Prevent form submission if inside a form
        handleSubmit();
    }
});

noteBtn.addEventListener("click", () => {
    // Show the notebox with initial text
    if (nb.style.display == "flex"){
        noteBtn.innerHTML = "Open Notes";
        nb.style.display = "none";
        return;
    }
    else{
        nb.style.display = "flex";
        noteBtn.innerHTML = "Save Notes and Close";
        noteBtn.onclick = () => {
            userData.UserNotes.push(nb.innerHTML);
        }
        if (nb.value === "") {
            nb.value = "Type your notes here...";
            nb.style.color = "#aaa"; // grey for placeholder effect
        }
    }
    
});



window.addEventListener("load", initHistory);

nb.addEventListener("focus", () => {
    if (nb.value === "Type your notes here...") {
        nb.value = "";
        nb.style.color = "#fff"; // normal text color
    }
});

pmt.addEventListener("focus",() => {
    if (pmt.value === "Provide your prompt here..."){
        pmt.value ="";
        pmt.style.color = "#fff";
    }
})