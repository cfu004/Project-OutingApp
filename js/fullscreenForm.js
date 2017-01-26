/**
 * fullscreenForm.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2014, Codrops
 * http://www.codrops.com
 */

(function(window) {

    'use strict';

    var support = {
            animations: Modernizr.cssanimations
        },
        animEndEventNames = {
            'WebkitAnimation': 'webkitAnimationEnd',
            'OAnimation': 'oAnimationEnd',
            'msAnimation': 'MSAnimationEnd',
            'animation': 'animationend'
        },
        // animation end event name
        animEndEventName = animEndEventNames[Modernizr.prefixed('animation')];

    /**
     * extend obj function
     */
    function extend(a, b) {
        for (var key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        return a;
    }

    /**
     * createElement function
     * creates an element with tag = tag, className = opt.cName, innerHTML = opt.inner and appends it to opt.appendTo
     */
    function createElement(tag, opt) {
        var el = document.createElement(tag)
        if (opt) {
            if (opt.cName) {
                el.className = opt.cName;
            }
            if (opt.inner) {
                el.innerHTML = opt.inner;
            }
            if (opt.appendTo) {
                opt.appendTo.appendChild(el);
            }
        }
        return el;
    }

    /**
     * FForm function
     */
    function FForm(el, options) {
        this.el = el;
        this.options = extend({}, this.options);
        extend(this.options, options);
        this._init();
    }

    /**
     * FForm options
     */
    FForm.prototype.options = {
        // show progress bar
        ctrlProgress: true,
        // show navigation dots
        ctrlNavDots: true,
        // show [current field]/[total fields] status
        ctrlNavPosition: true,
        // reached the review and submit step
        onReview: function() {
            return false;
        }
    };

    /**
     * init function
     * initialize and cache some vars
     */
    FForm.prototype._init = function() {
        // the form element
        this.formEl = this.el.querySelector('form');

        // list of fields
        this.fieldsList = this.formEl.querySelector('ol.fs-fields');

        // current field position
        this.current = 0;

        // all fields
        this.fields = [].slice.call(this.fieldsList.children);

        // total fields
        this.fieldsCount = this.fields.length;

        // show first field
        classie.add(this.fields[this.current], 'fs-current');

        // create/add controls
        this._addControls();

        // create/add messages
        this._addErrorMsg();

        // init events
        this._initEvents();
    };

    /**
     * addControls function
     * create and insert the structure for the controls
     */
    FForm.prototype._addControls = function() {
        // main controls wrapper
        this.ctrls = createElement('div', {
            cName: 'fs-controls',
            appendTo: this.el
        });

        // continue button (jump to next field)
        this.ctrlContinue = createElement('button', {
            cName: 'fs-continue',
            inner: 'Continue',
            appendTo: this.ctrls
        });
        this._showCtrl(this.ctrlContinue);

        // navigation dots
        if (this.options.ctrlNavDots) {
            this.ctrlNav = createElement('nav', {
                cName: 'fs-nav-dots',
                appendTo: this.ctrls
            });
            var dots = '';
            for (var i = 0; i < this.fieldsCount; ++i) {
                dots += i === this.current ? '<button class="fs-dot-current"></button>' : '<button disabled></button>';
            }
            this.ctrlNav.innerHTML = dots;
            this._showCtrl(this.ctrlNav);
            this.ctrlNavDots = [].slice.call(this.ctrlNav.children);
        }

        // field number status
        if (this.options.ctrlNavPosition) {
            this.ctrlFldStatus = createElement('span', {
                cName: 'fs-numbers',
                appendTo: this.ctrls
            });

            // current field placeholder
            this.ctrlFldStatusCurr = createElement('span', {
                cName: 'fs-number-current',
                inner: Number(this.current + 1)
            });
            this.ctrlFldStatus.appendChild(this.ctrlFldStatusCurr);

            // total fields placeholder
            this.ctrlFldStatusTotal = createElement('span', {
                cName: 'fs-number-total',
                inner: this.fieldsCount
            });
            this.ctrlFldStatus.appendChild(this.ctrlFldStatusTotal);
            this._showCtrl(this.ctrlFldStatus);
        }

        // progress bar
        if (this.options.ctrlProgress) {
            this.ctrlProgress = createElement('div', {
                cName: 'fs-progress',
                appendTo: this.ctrls
            });
            this._showCtrl(this.ctrlProgress);
        }
    }

    /**
     * addErrorMsg function
     * create and insert the structure for the error message
     */
    FForm.prototype._addErrorMsg = function() {
        // error message
        this.msgError = createElement('span', {
            cName: 'fs-message-error',
            appendTo: this.el
        });
    }

    /**
     * init events
     */
    FForm.prototype._initEvents = function() {
        var self = this;

        // show next field
        this.ctrlContinue.addEventListener('click', function() {
            self._nextField();
        });

        // navigation dots
        if (this.options.ctrlNavDots) {
            this.ctrlNavDots.forEach(function(dot, pos) {
                dot.addEventListener('click', function() {
                    self._showField(pos);
                });
            });
        }

        // jump to next field without clicking the continue button (for fields/list items with the attribute "data-input-trigger")
        this.fields.forEach(function(fld) {
            if (fld.hasAttribute('data-input-trigger')) {
                var input = fld.querySelector('input[type="radio"]') || /*fld.querySelector( '.cs-select' ) ||*/ fld.querySelector('select'); // assuming only radio and select elements (TODO: exclude multiple selects)
                if (!input) return;

                switch (input.tagName.toLowerCase()) {
                    case 'select':
                        input.addEventListener('change', function() {
                            self._nextField();
                        });
                        break;

                    case 'input':
                        [].slice.call(fld.querySelectorAll('input[type="radio"]')).forEach(function(inp) {
                            inp.addEventListener('change', function(ev) {
                                self._nextField();
                            });
                        });
                        break;

                        /*
                        // for our custom select we would do something like:
                        case 'div' : 
                        	[].slice.call( fld.querySelectorAll( 'ul > li' ) ).forEach( function( inp ) {
                        		inp.addEventListener( 'click', function(ev) { self._nextField(); } );
                        	} ); 
                        	break;
                        */
                }
            }
        });

        // keyboard navigation events - jump to next field when pressing enter
        document.addEventListener('keydown', function(ev) {
            if (!self.isLastStep && ev.target.tagName.toLowerCase() !== 'textarea') {
                var keyCode = ev.keyCode || ev.which;
                if (keyCode === 13) {
                    ev.preventDefault();
                    self._nextField();
                }
            }
        });
    };

    /**
     * nextField function
     * jumps to the next field
     */
    FForm.prototype._nextField = function(backto) {
        if (this.isLastStep || !this._validade() || this.isAnimating) {
            return false;
        }
        this.isAnimating = true;

        // check if on last step
        this.isLastStep = this.current === this.fieldsCount - 1 && backto === undefined ? true : false;

        // clear any previous error messages
        this._clearError();

        // current field
        var currentFld = this.fields[this.current];

        // save the navigation direction
        this.navdir = backto !== undefined ? backto < this.current ? 'prev' : 'next' : 'next';

        // update current field
        this.current = backto !== undefined ? backto : this.current + 1;

        if (backto === undefined) {
            // update progress bar (unless we navigate backwards)
            this._progress();

            // save farthest position so far
            this.farthest = this.current;
        }

        // add class "fs-display-next" or "fs-display-prev" to the list of fields
        classie.add(this.fieldsList, 'fs-display-' + this.navdir);

        // remove class "fs-current" from current field and add it to the next one
        // also add class "fs-show" to the next field and the class "fs-hide" to the current one
        classie.remove(currentFld, 'fs-current');
        classie.add(currentFld, 'fs-hide');

        if (!this.isLastStep) {
            // update nav
            this._updateNav();

            // change the current field number/status
            this._updateFieldNumber();

            var nextField = this.fields[this.current];
            classie.add(nextField, 'fs-current');
            classie.add(nextField, 'fs-show');
        }

        // after animation ends remove added classes from fields
        var self = this,
            onEndAnimationFn = function(ev) {
                if (support.animations) {
                    this.removeEventListener(animEndEventName, onEndAnimationFn);
                }

                classie.remove(self.fieldsList, 'fs-display-' + self.navdir);
                classie.remove(currentFld, 'fs-hide');

                if (self.isLastStep) {
                    // show the complete form and hide the controls
                    self._hideCtrl(self.ctrlNav);
                    self._hideCtrl(self.ctrlProgress);
                    self._hideCtrl(self.ctrlContinue);
                    self._hideCtrl(self.ctrlFldStatus);
                    // replace class fs-form-full with fs-form-overview
                    classie.remove(self.formEl, 'fs-form-full');
                    classie.add(self.formEl, 'fs-form-overview');
                    classie.add(self.formEl, 'fs-show');
                    // callback
                    self.options.onReview();
                } else {
                    classie.remove(nextField, 'fs-show');

                    if (self.options.ctrlNavPosition) {
                        self.ctrlFldStatusCurr.innerHTML = self.ctrlFldStatusNew.innerHTML;
                        self.ctrlFldStatus.removeChild(self.ctrlFldStatusNew);
                        classie.remove(self.ctrlFldStatus, 'fs-show-' + self.navdir);
                    }
                }
                self.isAnimating = false;
            };

        if (support.animations) {
            if (this.navdir === 'next') {
                if (this.isLastStep) {
                    currentFld.querySelector('.fs-anim-upper').addEventListener(animEndEventName, onEndAnimationFn);
                } else {
                    nextField.querySelector('.fs-anim-lower').addEventListener(animEndEventName, onEndAnimationFn);
                }
            } else {
                nextField.querySelector('.fs-anim-upper').addEventListener(animEndEventName, onEndAnimationFn);
            }
        } else {
            onEndAnimationFn();
        }
    }

    /**
     * showField function
     * jumps to the field at position pos
     */
    FForm.prototype._showField = function(pos) {
        if (pos === this.current || pos < 0 || pos > this.fieldsCount - 1) {
            return false;
        }
        this._nextField(pos);
    }

    /**
     * updateFieldNumber function
     * changes the current field number
     */
    FForm.prototype._updateFieldNumber = function() {
        if (this.options.ctrlNavPosition) {
            // first, create next field number placeholder
            this.ctrlFldStatusNew = document.createElement('span');
            this.ctrlFldStatusNew.className = 'fs-number-new';
            this.ctrlFldStatusNew.innerHTML = Number(this.current + 1);

            // insert it in the DOM
            this.ctrlFldStatus.appendChild(this.ctrlFldStatusNew);

            // add class "fs-show-next" or "fs-show-prev" depending on the navigation direction
            var self = this;
            setTimeout(function() {
                classie.add(self.ctrlFldStatus, self.navdir === 'next' ? 'fs-show-next' : 'fs-show-prev');
            }, 25);
        }
    }

    /**
     * progress function
     * updates the progress bar by setting its width
     */
    FForm.prototype._progress = function() {
        if (this.options.ctrlProgress) {
            this.ctrlProgress.style.width = this.current * (100 / this.fieldsCount) + '%';
        }
    }

    /**
     * updateNav function
     * updates the navigation dots
     */
    FForm.prototype._updateNav = function() {
        if (this.options.ctrlNavDots) {
            classie.remove(this.ctrlNav.querySelector('button.fs-dot-current'), 'fs-dot-current');
            classie.add(this.ctrlNavDots[this.current], 'fs-dot-current');
            this.ctrlNavDots[this.current].disabled = false;
        }
    }

    /**
     * showCtrl function
     * shows a control
     */
    FForm.prototype._showCtrl = function(ctrl) {
        classie.add(ctrl, 'fs-show');
    }

    /**
     * hideCtrl function
     * hides a control
     */
    FForm.prototype._hideCtrl = function(ctrl) {
        classie.remove(ctrl, 'fs-show');
    }

    // TODO: this is a very basic validation function. Only checks for required fields..
    FForm.prototype._validade = function() {
        var fld = this.fields[this.current],
            input = fld.querySelector('input[required]') || fld.querySelector('textarea[required]') || fld.querySelector('select[required]'),
            error;

        if (!input) return true;

        switch (input.tagName.toLowerCase()) {
            case 'input':
                if (input.type === 'radio' || input.type === 'checkbox') {
                    var checked = 0;
                    [].slice.call(fld.querySelectorAll('input[type="' + input.type + '"]')).forEach(function(inp) {
                        if (inp.checked) {
                            ++checked;
                        }
                    });
                    if (!checked) {
                        error = 'NOVAL';
                    }
                } else if (input.value === '') {
                    error = 'NOVAL';
                }
                break;

            case 'select':
                // assuming here '' or '-1' only
                if (input.value === '' || input.value === '-1') {
                    error = 'NOVAL';
                }
                break;

            case 'textarea':
                if (input.value === '') {
                    error = 'NOVAL';
                }
                break;
        }

        if (error != undefined) {
            this._showError(error);
            return false;
        }

        return true;
    }

    // TODO
    FForm.prototype._showError = function(err) {
        var message = '';
        switch (err) {
            case 'NOVAL':
                message = 'Please fill the field before continuing';
                break;
            case 'INVALIDEMAIL':
                message = 'Please fill a valid email address';
                break;
                // ...
        };
        this.msgError.innerHTML = message;
        this._showCtrl(this.msgError);
    }

    // clears/hides the current error message
    FForm.prototype._clearError = function() {
        this._hideCtrl(this.msgError);
    }



    // add to global namespace
    window.FForm = FForm;


    var config = {
        apiKey: "AIzaSyA8M_5lYpMyai148IIMJiKH9hAhZEzXSrA",
        authDomain: "my-first-firebase-cf941.firebaseapp.com",
        databaseURL: "https://my-first-firebase-cf941.firebaseio.com",
        storageBucket: "my-first-firebase-cf941.appspot.com",
    };

    console.log(2);
    firebase.initializeApp(config);

    var database = firebase.database();

    $("#submit").on("click", function() {
        $(".container").hide();
        localStorage.clear();
        var nameInput = $("#q1").val().trim();
        var emailInput = $("#q2").val().trim();
        var businessnameInput = $("#q3").val().trim();
        var locationInput = $("#q4").val().trim();
        var destinationInput = $("#q5").val().trim();
        var uberInput = $("#q6").val().trim();


        var apiKey = 'AIzaSyAN0oSPw6LioE4Jdy-UjD2H0pWbvani_Wg';
        var queryURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + locationInput + '&key=' + apiKey;

        console.log(locationInput);
        console.log(uberInput);



        // First API Call
        // $.getJSON(queryURL, function(result){
        // 	console.log("result of getJSON call", result);
        // });

        // Second API Call
        $.ajax({
            url: queryURL,
            method: 'GET'
        }).done(function(result) {
            // Creates local "temporary" object for holding employee data

            // Logs everything to console


            console.log(result);
            console.log(result.results[0].geometry.location.lat);
            console.log(result.results[0].geometry.location.lng);
            var startLat = result.results[0].geometry.location.lat;
            var startLng = result.results[0].geometry.location.lng;


            var destinationURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + destinationInput + '&key=' + apiKey;

            console.log(destinationInput);



            $.ajax({
                url: destinationURL,
                method: 'GET'
            }).done(function(result) {


                // Logs everything to console


                console.log(result);
                console.log(result.results[0].geometry.location.lat);
                console.log(result.results[0].geometry.location.lng);
                var endLat = result.results[0].geometry.location.lat;
                var endLng = result.results[0].geometry.location.lng;

                //Google Places Map


                var map;
                var infowindow;
                initMap();

                function initMap() {
                    var dest = {
                        lat: endLat,
                        lng: endLng
                    };

                    map = new google.maps.Map(document.getElementById('map'), {
                        center: dest,
                        zoom: 15
                    });

                    infowindow = new google.maps.InfoWindow();
                    var service = new google.maps.places.PlacesService(map);
                    service.nearbySearch({
                        location: dest,
                        radius: 5000,
                        keyword: [businessnameInput]
                    }, callback);
                }

                function callback(results, status) {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        for (var i = 0; i < results.length; i++) {
                            createMarker(results[i]);
                        }
                    }
                }

                function createMarker(place) {
                    var placeLoc = place.geometry.location;
                    var marker = new google.maps.Marker({
                        map: map,
                        position: place.geometry.location
                    });

                    google.maps.event.addListener(marker, 'mouseover', function() {
                        infowindow.setContent(place.name + " rating: " + place.rating);
                        console.log(place.name);
                        console.log(place.rating);
                        infowindow.open(map, this);
                    });
                    google.maps.event.addListener(marker, 'click', function() {
                        var x = place.geometry.location.lat();
                        var y = place.geometry.location.lng();
                        console.log(x);
                        console.log(y);

                        function getPrice() {
                            $("#startover").remove();
                            var distanceURL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + locationInput + "&destinations=" + x + "," + y + "&key=" + apiKey;

                            // $.getJSON('http://anyorigin.com/get?url=%22https%3A//maps.googleapis.com/maps/api/distancematrix/json%3Funits%3Dimperial%26origins%3D' + locationInput +'%2%26destinations%3D%2'+ x + y + '%2%26key%3D%2' + apiKey, function(data){
                            // 	console.log(data);
                            // 	});
                            // $.ajax({url: distanceURL, method: 'GET'}).done(function(matrix){
                            // var duration = matrix.row.elements.duration.value;
                            // var distance = matrix.row.elements.distance.value;
                            // var durtext = matrix.row.elements.duration.text;
                            // var distext = matrix.row.elements.distance.text;

                            var duration = (Math.random() * 900 + 900).toFixed(2);
                            console.log(duration);
                            var distance = (Math.random() * 3 + 4).toFixed(2);
                            console.log(distance);
                            var price;

                            if (uberInput === "UberX") {
                                var price = ((duration / 60) * 0.15 + (distance * 0.9) + 1.65).toFixed(2);
                                console.log("Your estimate is $" + price);
                                $("#route").html("Your start location is " + locationInput + " and your end location is " + place.name);
                                $("#uber").html("You have chosen " + uberInput);
                                $("#estimate").html("Your estimate is $" + price);
                                $("#solution").append("<button id='startover'>start over</button>");
                                $('#startover').on('click', function() {
                                    location.reload();
                                });

                            } else if (uberInput === "UberXL") {
                                var price = (1 + (duration / 60) * 0.3 + (distance * 1.55) + 1.65).toFixed(2);
                                console.log("Your estimate is $" + price);
                                $("#route").html("Your start location is " + locationInput + " and your end location is " + place.name);
                                $("#uber").html("You have chosen " + uberInput);
                                $("#estimate").html("Your estimate is $" + price);
                                $('#startover').on('click', function() {
                                    location.reload();
                                });
                            } else if (uberInput === "UberBlack") {
                                var price = 8 + (duration / 60) * 0.45 + (distance * 3.55);
                                console.log("Your estimate is $" + price);
                                $("#route").html("Your start location is " + locationInput + " and your end location is " + place.name);
                                $("#uber").html("You have chosen " + uberInput);
                                $("#estimate").html("Your estimate is $" + price);
                                $('#startover').on('click', function() {
                                    location.reload();
                                });
                            } else if (uberInput === "UberSUV") {
                                var price = 15 + (duration / 60) * 0.55 + (distance * 4.25);
                                console.log("Your estimate is $" + price);
                                $("#route").html("Your start location is " + locationInput + " and your end location is " + place.name);
                                $("#uber").html("You have chosen " + uberInput);
                                $("#estimate").html("Your estimate is $" + price);
                                $('#startover').on('click', function() {
                                    location.reload();
                                });
                            } else {
                                var price = "Unable to get price!"
                                console.log("Your estimate is $" + price);
                                $("#route").html("Your start location is " + locationInput + " and your end location is " + place.name);
                                $("#uber").html("You have chosen " + uberInput);
                                $("#estimate").html("Your estimate is $" + price);
                                $("#solution").append("<button id='startover'>start over</button>");
                                $('#startover').on('click', function() {
                                    location.reload();
                                });
                            }
                            // });

                        }
                        getPrice();
                        var newInput = {
                            name: nameInput,
                            email: emailInput,
                            bname: businessnameInput,
                            location: locationInput,
                            destination: destinationInput,
                            ubertype: uberInput
                        }
                        console.log(newInput.name);
                        console.log(newInput.email);
                        console.log(newInput.bname);
                        console.log(newInput.location);
                        console.log(newInput.destination);
                        console.log(newInput.ubertype);

                        // Uploads user data to the database
                        database.ref().push(newInput);

                    });
                }

            });


        });




        return false;
    });

})(window);