/*
 * TODO:
 * -[ ] cache data and update in background
 * -[ ] option: not remove messages
 * -[ ] option: not render Todo and Redo lists
 * -[ ] option: not render table
 * -[ ] options without Save button
 * -[ ] open in current tab if it's blank
 * -[ ] able to collapse done modules
 */

// Get the main div of the page and clear it
var content = document.getElementById('content');
remove_all_assignments();

// Create Div for table
var div_top = document.createElement("div");
var table = document.createElement("table");
div_top.className = "message_board";

// Create the To Redo Section
var to_redo_div = document.createElement("div");
var title_redo = document.createElement("h2");
title_redo.innerHTML = "Assignments To Redo";
to_redo_div.appendChild(title_redo);

// Create the To Do Section
var todo_div = document.createElement("div")
var title_todo = document.createElement("h2");
title_todo.innerHTML = "Assignments To Do";
todo_div.appendChild(title_todo);

// Create Table And Column Headers
var header = table.createTHead();
var row = header.insertRow(0);
var h1 = row.insertCell(0);
var h2 = row.insertCell(1);
var h3 = row.insertCell(2);
var h4 = row.insertCell(3);
var h5 = row.insertCell(4);
h1.innerHTML = "Module";
h2.innerHTML = "To Do";
h3.innerHTML = "Redo";
h4.innerHTML = "Submitted";
h5.innerHTML = "Done";
// add tbody to table so insertRow append to tbody not thead
tBody = table.createTBody();

// Add Elements
content.appendChild(div_top);
content.appendChild(to_redo_div);
content.appendChild(todo_div);
div_top.appendChild(table);

// Download json of every subject
let assigment_array = Array.from(document.querySelector("#navi-bar > ul > li:nth-child(2) > ul").children);
let json_url_array = assigment_array.map(el => '/rest/course/Assignment?exercise__module__subject__name=' + (el.children[0].text));
let json_promises_array = json_url_array.map(url => fetch(url, { credentials: 'include' }).then(x => x.json()));
Promise.all(json_promises_array).then(do_the_work).catch(ex => { console.log('request failed ::', ex) });


/*************** Functions ******************/

function remove_all_assignments() {
    while (content.lastChild) {
        content.removeChild(content.lastChild);
    }
}


// Create a content box and add it to the dom
function add_assignment(href, name, subject, module, redo_flag) {
    // Create Elements
    div = document.createElement("div");
    a = document.createElement("a");
    h3 = document.createElement("h3");
    p = document.createElement("p");

    // Populate Elements
    div.className = "message_board";
    a.href = href;
    ass_name = "Assignment: " + name;
    h3.innerHTML = ass_name;
    p.innerHTML = "Subject: " + subject + "<br/>Module: " + module;

    // Add elemnts to the DOM
    a.appendChild(h3);
    div.appendChild(a);
    div.appendChild(p);
    redo_flag ? to_redo_div.appendChild(div) : todo_div.appendChild(div);
}


// parse objects and populate the table
function do_the_work(subjects_list) {
    subjects_list.forEach(subject => {
        let subject_name = subject["0"].exercise.module.subject.name;
        let subject_url = "/course/status?subject=" + subject_name;
        let stats = {
            todo: 0,
            redo: 0,
            submitted: 0,
            done: 0
        }

        // Go throught current subject's json to count different states of excercises
        subject.forEach((excercise) => {
            href = "/messages/thread/" + excercise.pk;
            name = excercise.description
            subject = excercise.exercise.module.subject.name
            module = excercise.exercise.module.name
            switch (excercise.status) {
                case "New":
                    stats.todo++;
                    add_assignment(href, name, subject, module, false);
                    break;
                case "Redo":
                    stats.redo++;
                    add_assignment(href, name, subject, module, true);
                    break;
                case "Submitted":
                    stats.submitted++;
                    break;
                case "Done":
                    stats.done++;
                    break;
                default:
                    break;
            }
        });

        let row = tBody.insertRow();
        // row header
        row.insertCell().innerHTML = `<a href="${subject_url}">${subject_name}</a>`;
        // filling number columns
        for (stat in stats) {
            let cell = row.insertCell();
            cell.innerHTML = stats[stat];
            // dim cell if value is 0
            if (stats[stat] == 0) cell.className = "zero";
        }

        // dim whole row if everything is Done
        if (stats.todo == 0 && stats.redo == 0 && stats.submitted == 0 && stats.done != 0) {
            row.className = "done";
        }
    })
}
