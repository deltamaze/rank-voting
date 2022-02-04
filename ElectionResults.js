// variables
let candidates = {};
let ballots = []
let electionName = "";
let electionId = "";
const delimCharacter = "~";
let databaseConnected = false;
let errorHasBeenThrown = false;
let rawElectionData = null;
let rawBallotData = null
// document elements
let headerElectionName = document.getElementById("HeaderElectionName");
let divErrorStatus = document.getElementById("DivErrorStatus")
let divInfo = document.getElementById("DivInfo");
// parse uri parameters


appStart();

async function appStart() {
  try {
    await waitForDatabaseToConnect();
    parseElectionIdFromUri();
    await loadRawElectionData();
    await loadRawBallotData();
    parseElectionData();
    parseBallotData();
    displayElectionName();
    calculateResults();
  }
  catch (err) {
    console.log(`Error thrown e=> ${err.toString()}`);
    throw (err)
  }
}

function throwUserError(errorMsg) {
  divErrorStatus.innerHTML = errorMsg
  throw errorMsg;
}

async function waitForDatabaseToConnect() {
  return await new Promise(resolve => {
    let keepWaitingCount = 0;
    var interval = setInterval(function () {
      if (database != undefined || keepWaitingCount < 10) {
        clearInterval(interval);
        resolve();
        if (keepWaitingCount < 10) {
        }
        else {
          throwUserError('Database was unable to connect after 10 seconds');
        }
      }
      else {
        retryCount += 1;
        console.log(`Database not connected, Attempt #:${retryCount}`);
      }
    }, 1000);

  });
  // html file should initiate connection to Firebase
  // wait for connection to be established before proceeding with appStart
}

function parseElectionIdFromUri() {
  const uriParameters = window.location.search;
  if (uriParameters == "") {
    throwUserError('ElectionID Missing from URL')
  }

  try {
    splitString = uriParameters.split("=")
    splitString.shift();
    electionId = splitString.join("");
  }
  catch (err) {
    divErrorStatus.innerHTML = `Unable to parse ElectionId from URL err=> ${err.toString()}`;
    throw (err)
  }

  if (electionId == "") {
    throwUserError('ElectionID was not found in from URL');
  }
}

async function loadRawElectionData() {
  await get(ref(database, `Elections/${electionId}`)).then(data => {
    if (data.exists()) {
      rawElectionData = data;
    } else {
      throwUserError(`Snapshot Loaded, but no Election data exist in Database for ElectionId => ${electionId}`)
    }
  })
    .catch(err => {
      throwUserError(`Database Error while looking up Election by ElectionID. err=> ${err.toString()}`)
    });;
}
async function loadRawBallotData() {
  await get(ref(database, `Ballots/${electionId}`)).then(data => {
    if (data.exists()) {
      rawBallotData = data;
    } else {
      throwUserError(`Snapshot Loaded, but no Ballot data exist in Database for ElectionId => ${electionId}`)
    }
  })
    .catch(err => {
      throwUserError(`Database Error while looking up Ballot by ElectionID. err=> ${err.toString()}`)
    });
}

function parseElectionData() {
  //id
  electionId = rawElectionData.key
  let electionData = rawElectionData.val()
  //name
  electionName = electionData.name;
  //candidates
  let rawCandidates = unpack(electionData.candidates);
  rawCandidates.forEach(name => {
    if (candidates[name] == undefined) {
      candidates[name] = (new Candidates());
    }
  })
}

function parseBallotData() {

  let ballotData = rawBallotData.val()
  let ballotKeys = Object.keys(ballotData);
  ballots = new Array(ballotKeys.length);
  let insertIndex = 0;
  Object.keys(ballotData).forEach(function (key) {
    let rankedVote = unpack(ballotData[key].rankedCandidates)
    let ballot = new Ballot();
    for (let i = 0; i < rankedVote.length; i++) {
      ballot.addCandidate(rankedVote[i]);
    }
    ballots[insertIndex] = ballot;
    insertIndex += 1;
  })
}

function calculateResults() {
  let candidateKeys = Object.keys(candidates);
  let maxRoundsAllowed = 1000;
  divInfo.innerHTML = "Scroll to the bottom to see the winner <br />"
  if (candidateKeys.length < 1) {
    divInfo.innerHTML += "No Candidates Found for Election <br />";
    return;
  }
  if (candidateKeys.length == 1) {
    divInfo.innerHTML += `Only one Candidate found, winner is: ${candidateKeys[0]}<br />`;
    return;
  }
  let roundNum = 0;

  while (candidateKeys.length > 1) {
    if (roundNum > maxRoundsAllowed) {
      divInfo.innerHTML += `Round Number exceeded ${maxRoundsAllowed} That's probably not good<br />`;
    }

    tallyVotes(candidateKeys, roundNum);
    divInfo.innerHTML += `<br /><br />Current round: ${roundNum + 1}<br />`;
    // report standings
    divInfo.innerHTML += 'Standings<br />';
    // sort
    candidateKeys.sort(function (a, b) {
      if (candidates[a].firstPick > candidates[b].firstPick) {
        return -1;
      }
      if (candidates[a].firstPick < candidates[b].firstPick) {
        return 1;
      }
      if (candidates[a].secondPick > candidates[b].secondPick) {
        return -1;
      }
      if (candidates[a].secondPick < candidates[b].secondPick) {
        return 1;
      }
      if (candidates[a].thirdPick > candidates[b].thirdPick) {
        return -1;
      }
      if (candidates[a].thirdPick < candidates[b].thirdPick) {
        return 1;
      }
      return 0;
    });
    // display
    let displayHtml = ""
    displayHtml += "<table class ='tableStyling'><thead><tr><th>Candidate</th><th> First Picks </th><th> Second Picks </th><th> Third Picks </th></tr></thead>";
    displayHtml += "<tbody>"

    candidateKeys.forEach(key => {
      let targetCandidate = candidates[key];
      let firstPickStyling = "";
      let secondPickStyling = "";
      let thirdPickStyling = "";
      if (roundNum > 0 &&
        targetCandidate.firstPick - targetCandidate.previousFirstPicks > 0) {
        firstPickStyling = 'background-color: lightgreen'
      }
      if (roundNum > 0 &&
        targetCandidate.secondPick - targetCandidate.previousSecondPick > 0) {
        secondPickStyling = 'background-color: lightgreen'
      }
      if (roundNum > 0 &&
        targetCandidate.thirdPick - targetCandidate.previousThirdPick > 0) {
        thirdPickStyling = 'background-color: lightgreen'
      }

      displayHtml += '<tr>'
      displayHtml += `<td>${key}</td>`;
      displayHtml += `<td style="${firstPickStyling}"} >${targetCandidate.firstPick}</td>`;
      displayHtml += `<td style="${secondPickStyling}"} >${targetCandidate.secondPick}</td>`;
      displayHtml += `<td style="${thirdPickStyling}"} >${targetCandidate.thirdPick}</td>`;
      displayHtml += '</tr>'
    })
    displayHtml += "</tbody></table>";
    divInfo.innerHTML += displayHtml;

    // elimination
    // loop through and find candidate with least votes and eliminate
    let choppingBlock = []
    let choppingBlockRound = 1;
    let choppingBlockRoundMinVotes = null;
    while (choppingBlockRound <= 3) {

      if (choppingBlock.length == 1) {
        break;
      }
      if (choppingBlockRound == 1) {
        // initial load
        candidateKeys.forEach(key => {
          if (choppingBlockRoundMinVotes == null) {
            choppingBlock.push(key);
            choppingBlockRoundMinVotes = candidates[key].firstPick
          }
          else if (choppingBlockRoundMinVotes == candidates[key].firstPick) {
            choppingBlock.push(key);
          }
          else if (candidates[key].firstPick < choppingBlockRoundMinVotes) {
            choppingBlock = [];
            choppingBlock.push(key);
            choppingBlockRoundMinVotes = candidates[key].firstPick
          }
        })
      } else if (choppingBlockRound == 2) {
        let oldChoppingBlock = choppingBlock.slice();
        choppingBlock = [];
        oldChoppingBlock.forEach(key => {
          if (choppingBlockRoundMinVotes == null) {
            choppingBlock.push(key);
            choppingBlockRoundMinVotes = candidates[key].secondPick
          }
          else if (choppingBlockRoundMinVotes == candidates[key].secondPick) {
            choppingBlock.push(key);
          }
          else if (candidates[key].secondPick < choppingBlockRoundMinVotes) {
            choppingBlock = [];
            choppingBlock.push(key);
            choppingBlockRoundMinVotes = candidates[key].secondPick
          }
        })
      }
      else if (choppingBlockRound == 3) {
        let oldChoppingBlock = choppingBlock.slice();
        choppingBlock = [];
        oldChoppingBlock.forEach(key => {
          if (choppingBlockRoundMinVotes == null) {
            choppingBlock.push(key);
            choppingBlockRoundMinVotes = candidates[key].thirdPick
          }
          else if (choppingBlockRoundMinVotes == candidates[key].thirdPick) {
            choppingBlock.push(key);
          }
          else if (candidates[key].thirdPick < choppingBlockRoundMinVotes) {
            choppingBlock = [];
            choppingBlock.push(key);
            choppingBlockRoundMinVotes = candidates[key].thirdPick
          }
        })
      }
      choppingBlockRound += 1;
      choppingBlockRoundMinVotes = null;
    }
    if (choppingBlock.length == 1) {
      // divInfo.innerHTML += `Candidate with the least votes found: ${choppingBlock[0]}<br />`
    }
    if (choppingBlock.length > 1) {
      // identify last round updates
      let maxRoundNum = 0;
      choppingBlock.forEach(key => {
        maxRoundNum = Math.max(maxRoundNum, candidates[key].firstPickUpdateRound)
      })
      // remove candidates who reached firstLevelPicks before others on the chopping block
      for (let i = choppingBlock.length - 1; i >= 0; i -= 1) {
        if (candidates[choppingBlock[i]].firstPickUpdateRound < maxRoundNum) {
          // divInfo.innerHTML += `${choppingBlock[i]} Received votes in a round sooner than others, so has been marked safe<br />`;
          choppingBlock.splice(i, 1);
        }
      }
    }
    if (choppingBlock.length > 1) {
      // divInfo.innerHTML += `${choppingBlock.length} way tie for the least votes. Candidate will need a random tie breaker<br />`;

      choppingBlock.sort(function (a, b) {
        // use reverse string then sort to make less intuitive how tie breaker works, and slightly more random
        let aString = a.split('').reverse().join('');
        let bString = b.split('').reverse().join('');
        if (aString < bString) {
          return -1;
        }
        if (aString > bString) {
          return 1;
        }
        return 0;
      });
    }
    for (let i = choppingBlock.length - 1; i >= 0; i -= 1) {
      if (i > 0) {
        // divInfo.innerHTML += `${choppingBlock[i]} marked safe<br />`
      }
    }
    divInfo.innerHTML += `<h4 style="color: red">Eliminating ${choppingBlock[0]}</h4>`;
    // re-assign votes
    ballots.forEach(bal => {
      bal.eliminateCandidate(choppingBlock[0]);
    })
    for (let i = candidateKeys.length - 1; i >= 0; i -= 1) {
      if (candidateKeys[i] == choppingBlock[0]) {
        candidateKeys.splice(i, 1);
      }
    }

    roundNum += 1;
    // loop through, find candidate with lower vote, push previous round vote to new round
    // eliminate 

  }
  divInfo.innerHTML += `<h3>Winner is:</h3><br /><h1 style="text-decoration: underline;"> ${candidateKeys[0]} </h1><br />`
}
function tallyVotes(candidateKeys, roundNum) {
  // loop through each candidate and reset votes
  candidateKeys.forEach(key => {
    candidates[key].previousFirstPicks = candidates[key].firstPick
    candidates[key].firstPick = 0;
    candidates[key].previousSecondPick = candidates[key].secondPick
    candidates[key].secondPick = 0;
    candidates[key].previousThirdPick = candidates[key].thirdPick
    candidates[key].thirdPick = 0;
  })
  // loop through ballot and tally votes for the candidate
  for (let i = 0; i < ballots.length; i += 1) {
    // console.log(candidates);
    // first pick
    if (candidates[ballots[i].getFirstPick()] != undefined) {
      candidates[ballots[i].getFirstPick()].firstPick += 1;
    }
    else {
      if (ballots[i].getFirstPick() != 'nil') {
        console.log(`Ballot Candidate ${ballots[i].getFirstPick()} not found`);
      }
    }
    // second pick
    if (candidates[ballots[i].getSecondPick()] != undefined) {
      candidates[ballots[i].getSecondPick()].secondPick += 1;
    }
    else {
      if (ballots[i].getSecondPick() != 'nil') {
        console.log(`Ballot Candidate ${ballots[i].getSecondPick()} not found`);
      }
    }
    // third pick
    if (candidates[ballots[i].getThirdPick()] != undefined) {
      candidates[ballots[i].getThirdPick()].thirdPick += 1;
    }
    else {
      if (ballots[i].getThirdPick() != 'nil') {
        console.log(`Ballot Candidate ${ballots[i].getThirdPick()} not found`);
      }
    }
    candidateKeys.forEach(key => {
      if (candidates[key].firstPick > candidates[key].previousFirstPicks) {
        candidates[key].firstPickUpdateRound = roundNum
      }
    })
  }
}
function displayElectionName() {
  headerElectionName.innerHTML = electionName + " Results";
}


function unpack(packedString) {
  if (packedString.length == 0) {
    return [];
  }
  let unpackedString = atob(packedString);
  let array = unpackedString.split(delimCharacter);
  return array;
}

class Candidates {
  constructor() {
    this.firstPick = 0;
    this.previousFirstPicks = 0;
    this.secondPick = 0;
    this.previousSecondPick = 0;
    this.thirdPick = 0;
    this.previousThirdPick = 0;
    this.firstPickUpdateRound = 0;
  }
}

class Ballot {
  constructor() {
    this.rankings = new LinkedList();
  }
  eliminateCandidate(candidateToRemove) {
    let previousNode = this.rankings.head;
    let currentNode = previousNode.next
    while (currentNode) {
      if (currentNode.data == candidateToRemove) {
        previousNode.next = currentNode.next;
        currentNode = currentNode.next;
        currentNode.previous = previousNode;
      }
      previousNode = currentNode;
      currentNode = currentNode.next

    }
  }
  addCandidate(candidateToAdd) {
    let newNode = new ListNode(candidateToAdd);
    let referenceTail = this.rankings.tail
    let oldTail = referenceTail.previous
    oldTail.next = newNode;
    newNode.previous = oldTail;
    newNode.next = referenceTail;
    referenceTail.previous = newNode;
  }
  getFirstPick() {
    if (
      this.rankings.head.next != null &&
      this.rankings.head.next.data != null
    ) {
      return this.rankings.head.next.data;
    }
    return 'nil';
  }
  getSecondPick() {
    if (
      this.rankings.head.next != null &&
      this.rankings.head.next.next != null &&
      this.rankings.head.next.next.data != null
    ) {
      return this.rankings.head.next.next.data;
    }
    return 'nil';
  }
  getThirdPick() {
    if (
      this.rankings.head.next != null &&
      this.rankings.head.next.next != null &&
      this.rankings.head.next.next.next != null &&
      this.rankings.head.next.next.next.data != null
    ) {
      return this.rankings.head.next.next.next.data;
    }
    return 'nil';
  }
}

class LinkedList {
  constructor() {
    this.head = new ListNode(null);
    this.tail = new ListNode(null);
    this.head.next = this.tail;
    this.tail.previous = this.head;
  }
}

class ListNode {
  constructor(data) {
    this.data = data
    this.next = null
  }
}




// so if bookclub has 7 books, identify count on the election table

// 7 books

// get all ballots, example: 6 ballots

// 6 ballots means winner needs 3 votes
// if 7 ballots, 50% is 3.5 so round up to 4 votes

// first round, tally up all the ballots[0] against the master list
// master list = {book title, votePoints, roundUpdate, currentRank, isEliminated, previousRank
// book


// getVote(ballot,masterList,roundNum) return selectionName
// -- use master list to skip eliminated entries

// when tie, use base64 encoding string compare to determine winner/elimination

// loop that will state

// Round #
// if round != 0, if foundwinner=false : (elimination text
// Results
// if founderwinner = true
