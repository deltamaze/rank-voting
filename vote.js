// variables
let candidates = [];
let electionName = "";
let electionId = "";
let savedStatus = "";

var remove = document.querySelector('.draggable');

//document elements
let divHideAfterSubmit = document.getElementById("DivHideAfterSubmit");
let headerElectionName = document.getElementById("HeaderElectionName");
let muuri = document.getElementById("DivCandidates");
// let grid = new Muuri('#DivCandidates', {dragEnabled: true});
let divSaveStatus = document.getElementById("DivSaveStatus")
let divErrorStatus = document.getElementById("DivErrorStatus")
let inputVoterId = document.getElementById("InputVoterId")
let buttonSave = document.getElementById("ButtonSave");

//parse query from uri to load target election
const queryString = window.location.search;
let retryCount = 0;
//Wait for database connection, then parse UriQuery, lookup against DB
var interval = setInterval(function () {
  if (database != undefined || retryCount > 10) {
    clearInterval(interval);
    parseUriQuery();
    searchElection();
  }
  else {
    retryCount += 1;
    console.log(`Database not connected, Attempt #:${retryCount}`);
  }
}, 1000);

function parseUriQuery() {

  if (queryString == "") {
    divErrorStatus.innerHTML = "ElectionID Missing from URL"
    return;
  }
  try {
    splitString = queryString.split("=")
    splitString.shift();
    electionId = splitString.join("");
  }
  catch (err) {
    divErrorStatus.innerHTML = `Unable to parse ElectionId from URL err=> ${err.toString()}`;
    return;
  }

}

const delimCharacter = "~";

function searchElection() {
  if (electionId == "") {
    if (divErrorStatus.innerHTML.length == 0) {
      divErrorStatus.innerHTML = "ElectionID Missing from URL"
    }
    return;
  }
  get(ref(database, `Elections/${electionId}`)).then(data => {
    if (data.exists()) {
      loadElection(data);
      divErrorStatus.innerHTML = ""
    } else {
      divErrorStatus.innerHTML = "Election Not Found in Database"
    }
  })
    .catch(err => {
      divErrorStatus.innerHTML = "Database Error while looking up ElectionID. err=> " + err.toString();
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
  syncVariablesToInputs();
}

function syncVariablesToInputs() {
  syncName();
  syncCandidates();
  syncSaveStatus();
  syncErrorStatus();
}
function syncSaveStatus() {
  divSaveStatus.innerHTML = "Vote has not been submitted";
}
function syncErrorStatus() {
  divErrorStatus.innerHTML = "";
}
function syncName() {

  headerElectionName.innerHTML = electionName;

}
function syncCandidates() {

  // randomize

  shuffledCandidates = candidates
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)

  for (let x = 0; x < shuffledCandidates.length; x += 1) {
    let listItem = document.createElement("div");

    // listItem.draggable = "true"
    listItem.classList.add("draggable");
    listItem.classList.add("grid");
    // listItem.addEventListener('dragstart', dragStart, false);
    // listItem.addEventListener('dragenter', dragEnter, false);
    // listItem.addEventListener('dragover', dragOver, false);
    // listItem.addEventListener('dragleave', dragLeave, false);
    // listItem.addEventListener('drop', dragDrop, false);
    // listItem.addEventListener('dragend', dragEnd, false);
    listItem.innerHTML = shuffledCandidates[x];
    // let linebreak = document.createElement("br");
    muuri.appendChild(listItem);
    // olCandidateBlock.appendChild(linebreak);
  }
  // let grid = new Muuri(".grid", {dragEnabled: true});
}

function dragStart(e) {
  this.style.opacity = '0.4';
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
};

function dragEnter(e) {
  this.classList.add('over');
}

function dragLeave(e) {
  e.stopPropagation();
  this.classList.remove('over');
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function dragDrop(e) {
  if (dragSrcEl != this) {
    // create new element
    let listItem = document.createElement("li");
    listItem.draggable = "true"
    listItem.classList.add("draggable");
    listItem.addEventListener('dragstart', dragStart, false);
    listItem.addEventListener('dragenter', dragEnter, false);
    listItem.addEventListener('dragover', dragOver, false);
    listItem.addEventListener('dragleave', dragLeave, false);
    listItem.addEventListener('drop', dragDrop, false);
    listItem.addEventListener('dragend', dragEnd, false);
    listItem.innerHTML = dragSrcEl.innerHTML;
    let parentDiv = this.parentNode
    parentDiv.insertBefore(listItem, this);
    dragSrcEl.remove();
    //dragSrcEl.innerHTML = this.innerHTML;
    // this.innerHTML = e.dataTransfer.getData('text/html');
  }
  return false;
}

function dragEnd(e) {
  var listItems = document.querySelectorAll('.draggable');
  [].forEach.call(listItems, function (item) {
    item.classList.remove('over');
  });
  this.style.opacity = '1';
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
  // read div element with all the candidates
  // and find out the order they have been submitted in, then package up and
  // A post entry.
  
  let voterId = inputVoterId.value.toUpperCase();
  if(voterId == ''){
    
    inputVoterId.style.border = "2px solid red";
    
    alert('Please Enter your VoterId')
    return;
  }
  inputVoterId.style.border = "2px solid black";
  // loop through ol and read entries in order
  let rankedArray = []
  var listItems = document.querySelectorAll('.draggable');
  [].forEach.call(listItems, function (item) {
    rankedArray.push(item.innerHTML);
  });
  const postData = {
    rankedCandidates: package(rankedArray)
  };

  set(ref(database, `/Ballots/${electionId}/${voterId}`), postData).then(data => {
    divSaveStatus.innerHTML = `Vote Submitted <br /><br />Thank you for your service voter: ${inputVoterId.value.toUpperCase()}`;
    divErrorStatus.innerHTML="";
    buttonSave.style = "display: none";
    divHideAfterSubmit.style = "display: none";
    window.scrollTo(0, 0);
    
  }).catch(err => {
    divSaveStatus.innerHTML = "Unable to cast vote. See Error below";
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


var dragContainer = document.querySelector('.drag-container');
var itemContainers = [].slice.call(document.querySelectorAll('.board-column-content'));
var columnGrids = [];
var boardGrid;

// Init the column grids so we can drag those items around.
itemContainers.forEach(function (container) {
  var grid = new Muuri(container, {
    items: '.board-item',
    dragEnabled: true,
    dragSort: function () {
      return columnGrids;
    },
    dragContainer: dragContainer,
    dragAutoScroll: {
      targets: (item) => {
        return [
          { element: window, priority: 0 },
          { element: item.getGrid().getElement().parentNode, priority: 1 },
        ];
      }
    },
  })
  .on('dragInit', function (item) {
    item.getElement().style.width = item.getWidth() + 'px';
    item.getElement().style.height = item.getHeight() + 'px';
  })
  .on('dragReleaseEnd', function (item) {
    item.getElement().style.width = '';
    item.getElement().style.height = '';
    item.getGrid().refreshItems([item]);
  })
  .on('layoutStart', function () {
    boardGrid.refreshItems().layout();
  });

  columnGrids.push(grid);
});

// Init board grid so we can drag those columns around.
boardGrid = new Muuri('.board', {
  dragEnabled: false,
  dragHandle: '.board-column-header'
});