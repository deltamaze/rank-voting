let candidates = [];
let voters = [];
const delimCharacter = "~";
function addNewElection() {
    // A post entry.
  const postData = {
    name: "New Vote",
    options: "",
    voters: ""
  };

  // Get a key for a new Post.
  push(ref(database, 'Elections'),postData).then(data => {
    loadElection(data);
  });
}

function searchElection(){
    let inputExistingElectionId = document.getElementById("InputExistingElectionId").value;
    get(ref(database, `Elections/${inputExistingElectionId}`)).then(data => {
        if (data.exists()) {
            loadElection(data);
          } else {
            alert("Election Not Found");
          }
        
      });
}

function loadElection(electionData){
    let divElectionId = document.getElementById("DivElectionId");
    divElectionId.innerHTML = `Target Election ID: ${electionData.key}`;
}

function stringifyArray(array){
    // edge cases
    if(array.length == 0){
        return "";
    }
    let returnString = "";
    array.forEach(element => {
        returnString += `${element}${delimCharacter}`
    });
    // remove trailing delimiter
    returnString = returnString.substring(0,returnString.length-2);
    return returnString;
}