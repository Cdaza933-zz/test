if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then(function(registration) {
      console.log("Registration succcessful, scope is:", registration.scope);
    })
    .catch(function(error) {
      console.log("Service worker registration failed, error:", error);
    });
}

(function() {
  "use strict";
  const DB_NAME = "myDB";
  const DB_VERSION = 1; // Use a long long for this value (don't use a float)
  const DB_STATION_NAME = "stations";
  var db;

  // Used to keep track of which view is displayed to avoid uselessly reloading it
  var current_view_pub_key;

  function openDb() {
    console.log("openDb ...");
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function(evt) {
      // Better use "this" than "req" to get the result to avoid problems with
      // garbage collection.
      // db = req.result;

      db = this.result;
      var tx = db.transaction(DB_STATION_NAME, "readwrite");
      var store = tx.objectStore(DB_STATION_NAME);
      console.log("openDb DONE");
      var req = store.getAll();
      req.onsuccess = function(evt) {
        var app = {
          isLoading: true,
          visibleCards: {},
          selectedTimetables: [],
          spinner: document.querySelector(".loader"),
          cardTemplate: document.querySelector(".cardTemplate"),
          container: document.querySelector(".main"),
          addDialog: document.querySelector(".dialog-container")
        };
        /*****************************************************************************
         *
         * Event listeners for UI elements
         *
         ****************************************************************************/

        document
          .getElementById("butRefresh")
          .addEventListener("click", function() {
            // Refresh all of the metro stations
            app.updateSchedules();
          });

        document.getElementById("butAdd").addEventListener("click", function() {
          // Open/show the add new station dialog
          app.toggleAddDialog(true);
        });

        document
          .getElementById("butAddCity")
          .addEventListener("click", function() {
            var select = document.getElementById("selectTimetableToAdd");
            var selected = select.options[select.selectedIndex];
            var key = selected.value;
            var label = selected.textContent;
            if (!app.selectedTimetables) {
              app.selectedTimetables = [];
            }
            app.getSchedule(key, label);
            var tx = db.transaction(DB_STATION_NAME, "readwrite");
            var store = tx.objectStore(DB_STATION_NAME);
            var req = store.get(key);
            req.onsuccess = function(evt) {
              var value = evt.target.result;
              if (!value) {
                addStation(key, label);
              }
            };
            app.selectedTimetables.push({ key: key, label: label });
            app.toggleAddDialog(false);
          });

        document
          .getElementById("butAddCancel")
          .addEventListener("click", function() {
            // Close the add new station dialog
            app.toggleAddDialog(false);
          });

        /*****************************************************************************
         *
         * Methods to update/refresh the UI
         *
         ****************************************************************************/

        // Toggles the visibility of the add new station dialog.
        app.toggleAddDialog = function(visible) {
          if (visible) {
            app.addDialog.classList.add("dialog-container--visible");
          } else {
            app.addDialog.classList.remove("dialog-container--visible");
          }
        };

        // Updates a timestation card with the latest weather forecast. If the card
        // doesn't already exist, it's cloned from the template.

        app.updateTimetableCard = function(data) {


    

          var key = data.key;
          var dataLastUpdated = new Date(data.created);
          var schedules = data.schedules;
          var card = app.visibleCards[key];

          if (!card) {
            var label = data.label.split(", ");
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove("cardTemplate");
            card.querySelector(".label").textContent = title;
            card.querySelector(".subtitle").textContent = subtitle;
            card.removeAttribute("hidden");
            app.container.appendChild(card);
            app.visibleCards[key] = card;
          }
          card.querySelector(".card-last-updated").textContent = data.created;

          var scheduleUIs = card.querySelectorAll(".schedule");
          for (var i = 0; i < 4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if (schedule && scheduleUI) {
              scheduleUI.querySelector(".message").textContent =
                schedule.message;
            }
          }
          if (app.isLoading) {
            window.cardLoadTime = performance.now();
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
    }
        };

        /*****************************************************************************
         *
         * Methods for dealing with the model
         *
         ****************************************************************************/

        app.getSchedule = function(key, label) {
          var url = "https://api-ratp.pierre-grimaud.fr/v3/schedules/" + key;
          var request = new XMLHttpRequest();
          request.onreadystatechange = function() {
            window.ApiCall = performance.now();
            if (request.readyState === XMLHttpRequest.DONE) {
              if (request.status === 200) {
                var response = JSON.parse(request.response);
                var result = {};
                result.key = key;
                result.label = label;
                result.created = response._metadata.date;
                result.schedules = response.result.schedules;
                app.updateTimetableCard(result);
              }
            } else {
              // Return the initial weather forecast since no data is available.
              app.updateTimetableCard(initialStationTimetable);
            }
          };
          request.open("GET", url);
          request.send();
        };

        // Iterate all of the cards and attempt to get the latest timetable data
        app.updateSchedules = function() {
          var keys = Object.keys(app.visibleCards);
          keys.forEach(function(key) {
            app.getSchedule(key);
          });
        };

        /*
         * Fake timetable data that is presented when the user first uses the app,
         * or when the user has not saved any stations. See startup code for more
         * discussion.
         */

        var initialStationTimetable = {
          key: "metros/1/bastille/A",
          label: "Bastille, Direction La Défense",
          created: "2017-07-18T17:08:42+02:00",
          schedules: [
            {
              message: "0 mn"
            },
            {
              message: "2 mn"
            },
            {
              message: "5 mn"
            }
          ]
        };

        /************************************************************************
         *
         * Code required to start the app
         *
         * NOTE: To simplify this codelab, we've used localStorage.
         *   localStorage is a synchronous API and has serious performance
         *   implications. It should not be used in production applications!
         *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
         *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
         ************************************************************************/

        function clearStation(store_name) {
          var tx = db.transaction(DB_STATION_NAME, "readwrite");
          var store = tx.objectStore(DB_STATION_NAME);
          var req = store.clear();
          req.onsuccess = function(evt) {
            console.log("storeCleared");
          };
          req.onerror = function(evt) {
            console.error("clearObjectStore:", evt.target.errorCode);
          };
        }

        function addStation(key, label) {
          var tx = db.transaction(DB_STATION_NAME, "readwrite");
          var store = tx.objectStore(DB_STATION_NAME);
          console.log("addPublication arguments:", arguments);
          var obj = { key: key, label: label };
          var req;
          try {
            req = store.add(obj);
          } catch (e) {
            throw e;
          }
          req.onsuccess = function(evt) {
            console.log("Insertion in DB successful");
          };
          req.onerror = function() {
            console.error("addPublication error", this.error);
          };
        }
        var value = evt.target.result;
        if (value.length > 0) {
          for (var i = 0; i < value.length; i++) {
            app.getSchedule(value[i].key, value[i].label);
          }
          app.selectedTimetables = value;
        } else {
          app.getSchedule(
            "metros/1/bastille/A",
            "Bastille, Direction La Défense"
          );
          addStation(
            initialStationTimetable.key,
            initialStationTimetable.label
          );
        }
      };
    };
    req.onerror = function(evt) {
      console.error("openDb:", evt.target.errorCode);
    };

    req.onupgradeneeded = function(evt) {
      console.log("openDb.onupgradeneeded");
      var store = evt.currentTarget.result.createObjectStore(DB_STATION_NAME, {
        keyPath: "key",
        autoIncrement: false
      });

      store.createIndex("lable", "label", { unique: false });
    };
  }
  openDb();
})();
