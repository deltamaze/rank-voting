// variables
let candidates = [];
let voters = [];
let electionName = "";
let electionId = "";
let savedStatus = "";

//document elements
let inputExistingElectionId = document.getElementById("InputExistingElectionId").value;
let divElectionId = document.getElementById("DivElectionId");
let inputElectionName = document.getElementById("InputElectionName");
let divCandidateBlock = document.getElementById("DivCandidateBlock");
let divVoterBlock = document.getElementById("DivVoterBlock");
let divSaveStatus = document.getElementById("DivSaveStatus")
let divErrorStatus = document.getElementById("DivErrorStatus")

inputElectionName.addEventListener("change", function (event) {
  electionName = event.target.value;
  delayedSave();
});

const delimCharacter = "~";
function addNewElection() {
  // A post entry.
  const postData = {
    name: "NewElection",
    candidates: package([
      `candidate1`,
      `candidate2`,
      `candidate3`
    ]),
    voters: package([
      `id${Math.floor(1000 + Math.random() * 9000).toString()}`,
      `id${Math.floor(1000 + Math.random() * 9000).toString()}`,
      `id${Math.floor(1000 + Math.random() * 9000).toString()}`
    ])
  };

  // Get a key for a new Post.
  push(ref(database, 'Elections'), postData).then(data => {
    searchElection(data.key);
  }).catch(err => {
    divErrorStatus.innerHTML = err.toString();
  });
}
function loadPreviouslySavedElectionButtonClick() {
  searchElection(inputExistingElectionId);
}
function searchElection(inputExistingElectionId) {
  get(ref(database, `Elections/${inputExistingElectionId}`)).then(data => {
    if (data.exists()) {
      loadElection(data);
    } else {
      alert("Election Not Found");
    }
  })
    .catch(err => {
      divErrorStatus.innerHTML = err.toString();
    });;
}

function loadElection(electionSnapshot) {

  //id
  electionId = electionSnapshot.key
  let electionData = electionSnapshot.val()
  //name
  electionName = electionData.name;
  //candidates
  candidates = unpack(electionData.candidates);
  //voters
  voters = unpack(electionData.voters);
  syncVariablesToInputs();
}
function syncVariablesToInputs() {
  syncElectionId();
  syncName();
  syncCandidates();
  syncVoters();
  syncSaveStatus();
  syncErrorStatus();
}
function syncSaveStatus() {
  divSaveStatus.innerHTML = "Up to date";
}
function syncErrorStatus() {
  divErrorStatus.innerHTML = "";
}
function syncElectionId() {

  divElectionId.innerHTML = `Target Election ID: ${electionId}`;
}
function syncName() {

  inputElectionName.value = electionName;

}
function populateUpdateDeleteList(stringArray, targetElement) {

  if (targetElement != null) {
    while (targetElement.firstChild) {
      targetElement.removeChild(targetElement.firstChild);
    }
  }

  for (let x = 0; x < stringArray.length; x += 1) {
    let textInput = document.createElement("input");
    textInput.id = `textInput${x}}`
    textInput.type = "text"
    textInput.value = stringArray[x];
    textInput.addEventListener("change", function (event) {
      stringArray[x].value = event.target.value;
      delayedSave();
    })
    let deleteButton = document.createElement("input");
    deleteButton.id = `deleteInput${x}}`
    deleteButton.type = "button"
    deleteButton.value = "Delete"
    deleteButton.onclick = () => {
      stringArray.splice(x, 1);
      syncCandidates();
      syncVoters();
      delayedSave();
    };
    let linebreak = document.createElement("br");
    targetElement.appendChild(textInput);
    targetElement.appendChild(deleteButton);
    targetElement.appendChild(linebreak);
  }
}
function syncCandidates() {
  populateUpdateDeleteList(candidates, divCandidateBlock, "Candidate")
}
function syncVoters() {
  populateUpdateDeleteList(voters, divVoterBlock, "Voter")
}
function addCandidate() {
  candidates.push("New Candidate");
  syncCandidates();
  delayedSave();
}
function updateCandidate() {

}
function addVoter() {
  candidates.push("New Candidate");
  syncCandidates();
  delayedSave();
}
function updateVoter() {

}


function package(array) {
  // edge cases
  if (array.length == 0) {
    return "";
  }
  let returnString = "";
  array.forEach(element => {
    returnString += `${element}${delimCharacter}`
  });
  // remove trailing delimiter
  returnString = returnString.substring(0, returnString.length - 1);
  //base64 encode
  returnString = btoa(returnString);
  return returnString;
}

function unpack(packedString) {
  if (packedString.length == 0) {
    return [];
  }
  let unpackedString = atob(packedString);
  let array = unpackedString.split(delimCharacter);
  return array;
}

function test(data) {
  console.log(package([
    `id${Math.floor(1000 + Math.random() * 9000).toString}`,
    `id${Math.floor(1000 + Math.random() * 9000).toString}`,
    `id${Math.floor(1000 + Math.random() * 9000).toString}`
  ]));
}

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this, args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

function save() {
  // A post entry.
  const postData = {
    name: electionName,
    candidates: package(candidates),
    voters: package(voters)
  };
  set(ref(database, `Elections/${electionId}`), postData).then(data => {
    syncSaveStatus();
  }).catch(err => {
    divErrorStatus.innerHTML = err.toString();
  });

}
const debouncedSave = debounce(function () {
  save()
}, 2000);

function delayedSave() {
  if (electionId == "") {
    divSaveStatus.innerHTML = "No Election is selected, search for an existing ID, or create a new election"
    return;
  }
  divSaveStatus.innerHTML = "Saving Changes Please Wait"
  debouncedSave();

}
