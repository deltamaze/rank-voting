// variables
let candidates = [];
// let voters = [];
let electionName = "";
let electionId = "";
let inputElectionId = ""
let savedStatus = "";
let adminPassword = "";

//document elements
let inputExistingElectionId = document.getElementById("InputExistingElectionId");
let divElectionId = document.getElementById("DivElectionId");
let inputElectionName = document.getElementById("InputElectionName");
let inputAdminPassword = document.getElementById("InputAdminPassword");
let divCandidateBlock = document.getElementById("DivCandidateBlock");
// let divVoterBlock = document.getElementById("DivVoterBlock");
let divSaveStatus = document.getElementById("DivSaveStatus")
let divErrorStatus = document.getElementById("DivErrorStatus")

inputElectionName.addEventListener("keydown", function (event) {
  electionName = event.target.value;
  // delayedSave();
});

inputElectionName.addEventListener("change", function (event) {
  electionName = event.target.value;
  // delayedSave();
});

inputAdminPassword.addEventListener("keydown", function (event) {
  adminPassword = event.target.value;
});

inputAdminPassword.addEventListener("change", function (event) {
  adminPassword = event.target.value;
});

inputExistingElectionId.addEventListener("keydown", function (event) {
  inputElectionId = event.target.value;
});

inputExistingElectionId.addEventListener("change", function (event) {
  inputElectionId = event.target.value;
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
    password: adminPassword
    // voters: package([
    //   `id${Math.floor(1000 + Math.random() * 9000).toString()}`,
    //   `id${Math.floor(1000 + Math.random() * 9000).toString()}`,
    //   `id${Math.floor(1000 + Math.random() * 9000).toString()}`
    // ])
  };

  // Get a key for a new Post.
  push(ref(database, 'Elections'), postData).then(data => {
    searchElection(data.key);
  }).catch(err => {
    divErrorStatus.innerHTML = err.toString();
  });
}

function loadPreviouslySavedElectionButtonClick() {
  searchElection(inputElectionId);
}

function searchElection(targetElection) {
  get(ref(database, `Elections/${targetElection}`)).then(data => {
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
  // //voters
  // voters = unpack(electionData.voters);
  syncVariablesToInputs();
}

function syncVariablesToInputs() {
  syncElectionId();
  syncName();
  syncCandidates();
  // syncVoters();
  syncSaveStatus();
  syncErrorStatus();
}

function syncSaveStatus() {
  divSaveStatus.innerHTML = "Up to date";
  divErrorStatus.innerHTML = "";
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
  
}

function syncCandidates() {
  if (divCandidateBlock != null) {
    while (divCandidateBlock.firstChild) {
      divCandidateBlock.removeChild(divCandidateBlock.firstChild);
    }
  }

  for (let x = 0; x < candidates.length; x += 1) {
    let textInput = document.createElement("input");
    textInput.id = `textInput${x}`
    textInput.type = "text"
    textInput.value = candidates[x];
    textInput.addEventListener("keydown", function (event) {
      candidates[x] = event.target.value;
      // delayedSave();
    })
    textInput.addEventListener("change", function (event) {
      candidates[x] = event.target.value;
      // delayedSave();
    })
    let deleteButton = document.createElement("input");
    deleteButton.id = `deleteInput${x}`
    deleteButton.type = "button"
    deleteButton.value = "Delete"
    deleteButton.onclick = () => {
      candidates.splice(x, 1);
      syncCandidates();
      // syncVoters();
      // delayedSave();
    };
    let linebreak = document.createElement("br");
    divCandidateBlock.appendChild(textInput);
    divCandidateBlock.appendChild(deleteButton);
    divCandidateBlock.appendChild(linebreak);
  }
}

// function syncVoters() {
//   populateUpdateDeleteList(voters, divVoterBlock, "Voter")
// }

function addCandidate() {
  candidates.push("New Candidate");
  syncCandidates();
  // delayedSave();
}

// function addVoter() {
//   candidates.push("New Candidate");
//   syncCandidates();
//   delayedSave();
// }

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
  //remove any "New Candidates"
  for (let x = 0; x < candidates.length; x += 1) {
    if (candidates[x] == "New Candidate"){
      candidates.splice(x, 1);
      syncCandidates();
    };
  }

  console.log(candidates);
  // A post entry.
  const postData = {
    name: electionName,
    password: adminPassword,
    candidates: package(candidates),
    // voters: package(voters)
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
//TODO display links for Voting/Results
//TODO Hide html Elements when no electionID is loaded