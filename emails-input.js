(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.EmailsInput = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var SETTINGS_DEFAULT = Object.freeze({
        emailInputFieldCSS: 'emails-input-field',
        emailInputElementCSS: '__inputElement',
        emailValidBlockCSS: '__validEmail',
        emailInvalidBlockCSS: '__invalidEmail',
        emailDeleteIconCSS: '__deleteEmailIcon',
        emailHolderFocusCSS: '__emailHolderFocus',
        maxLengthEmail: 30,
        minLengthEmail: 6,
        emailRegEx: new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        copyPasteSeparator: ',',
    });
    /**
     * @class SettingsService - This class creates and injects either default settings
     * or settings as provided by the user of this library.
     */
    var SettingsService = /** @class */ (function () {
        /**
         * @constructor
         * The constructor can take a settings object to (partially) overwrite the default settings.
         */
        function SettingsService(customConfig) {
            SettingsService.config = customConfig
                ? Object.freeze(__assign(__assign({}, SETTINGS_DEFAULT), customConfig))
                : SETTINGS_DEFAULT;
        }
        /**
         * @field config
         * This static field contains all the settings which,
         * can be consumed by other services / instances.
         */
        SettingsService.config = SETTINGS_DEFAULT;
        return SettingsService;
    }());

    var Outcome = /** @class */ (function () {
        function Outcome(isSuccess, error, value) {
            if (isSuccess && error) {
                throw new Error("Initialization void, an outcome cannot have both an error and success.");
            }
            if (!isSuccess && !error) {
                throw new Error("Initialization void, an error must contain a message.");
            }
            this.succeeded = isSuccess;
            this.failed = !isSuccess;
            this.error = error;
            this._value = value;
            Object.freeze(this);
        }
        Outcome.prototype.getValue = function () {
            if (!this.succeeded) {
                throw new Error("Outcome has failed, can not retrieve value");
            }
            return this._value;
        };
        Outcome.approved = function (value) {
            return new Outcome(true, null, value);
        };
        Outcome.decline = function (error) {
            return new Outcome(false, error);
        };
        return Outcome;
    }());

    var Email = /** @class */ (function () {
        /**
         * **Creates a new email instance after validation.**
         * @constructor
         * Emailaddress as a string literal.
         * @param email
         */
        function Email(email) {
            this.email = email;
        }
        /**
         * **Creates instance of email if validated, else throws err**
         * @function
         * Emailaddress as a string literal.
         * @param email
         */
        Email.createEmail = function (email) {
            if (!email) {
                return Outcome.decline('Email is not present');
            }
            if (email.length > SettingsService.config.maxLengthEmail ||
                email.length < SettingsService.config.minLengthEmail) {
                return Outcome.decline('Length of email is invalid');
            }
            if (!SettingsService.config.emailRegEx.test(email)) {
                return Outcome.decline('Email failed RegEx-test');
            }
            return Outcome.approved(new Email(email));
        };
        return Email;
    }());

    var EmailCollection = /** @class */ (function () {
        /**
         * @constructor
         * Possibility to add own list of emails to be added to _emailCollection
         * @param emailCollection
         */
        function EmailCollection(emailCollection) {
            /**
             * @field _emailCollection
             * Contains an immutable array of email instances.
             */
            this._emailCollection = [];
            if (Array.isArray(emailCollection) && emailCollection.length) {
                for (var _i = 0, emailCollection_1 = emailCollection; _i < emailCollection_1.length; _i++) {
                    var email = emailCollection_1[_i];
                    var createEmail = Email.createEmail(email);
                    if (createEmail.error) {
                        throw createEmail.getValue();
                    }
                    this._emailCollection = this._emailCollection.concat(createEmail.getValue());
                }
            }
        }
        Object.defineProperty(EmailCollection.prototype, "emailCollectionCount", {
            /**
             * @getter emailCollectionCount
             * Returns the count of current emailcollection.
             */
            get: function () {
                return this._emailCollection.length;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * @function addEmail
         * Adds an email to the email collection after performing some validation checks.
         * @param email
         */
        EmailCollection.prototype.addEmail = function (email) {
            var duplicateEmail = this._emailCollection.find(function (savedEmails) {
                return savedEmails.email === email;
            });
            var createEmail = Email.createEmail(email);
            if (duplicateEmail) {
                throw new Error('This email is a duplicate');
            }
            if (createEmail.error) {
                throw createEmail.error;
            }
            this._emailCollection = this._emailCollection.concat(createEmail.getValue());
        };
        /**
         * @function removeEmail
         * Removes an email from the email collection.
         * @param email
         */
        EmailCollection.prototype.removeEmail = function (email) {
            if (email) {
                this._emailCollection = this._emailCollection.filter(function (savedEmails) {
                    return savedEmails.email !== email;
                });
            }
        };
        return EmailCollection;
    }());

    var EmailsView = /** @class */ (function () {
        /**
         * @constructor
         * Passes the user entered ID to generate rootDiv.
         * @param emailCollection
         */
        function EmailsView(rootDiv) {
            if (!rootDiv) {
                throw new Error('No document ID has been specified to generate view');
            }
            this._rootDiv = document.getElementById(rootDiv);
            this._wrapperDiv = document.createElement('div');
            this._inputField = document.createElement('input');
            this._wrapperDiv.setAttribute('class', SettingsService.config.emailInputFieldCSS);
            this._wrapperDiv.setAttribute('tabindex', '1');
            this._rootDiv.appendChild(this._wrapperDiv);
            this._inputField.placeholder = 'add more people';
            this._inputField.type = 'email';
            this._inputField.className = SettingsService.config.emailInputElementCSS;
            this._wrapperDiv.appendChild(this._inputField);
        }
        /**
         * @function renderEmailblock
         * Renders the email block which contains validated emails.
         * @param email
         */
        EmailsView.prototype.renderEmailBlock = function (email, valid) {
            var emailBlock = document.createElement('span');
            var deleteEmailIcon = document.createElement('span');
            deleteEmailIcon.dataset.function = 'deleteEmail';
            deleteEmailIcon.classList.add(SettingsService.config.emailDeleteIconCSS);
            emailBlock.innerText = email;
            emailBlock.insertAdjacentElement('beforeend', deleteEmailIcon);
            if (valid) {
                emailBlock.classList.add(SettingsService.config.emailValidBlockCSS);
            }
            else {
                emailBlock.classList.add(SettingsService.config.emailInvalidBlockCSS);
                emailBlock.dataset.validity = 'false';
            }
            this._wrapperDiv.insertBefore(emailBlock, this._inputField);
            this._inputField.value = '';
        };
        return EmailsView;
    }());

    var EmailInputComponent = /** @class */ (function () {
        /**
         * @field _rootContainer - This field contains a reference to the root container to which this library
         * has been appended.
         */
        function EmailInputComponent(elementID, settings, emails) {
            this._settingsService = new SettingsService(settings);
            this._emailsView = new EmailsView(elementID);
            this.addAllEventListeners(this._emailsView._wrapperDiv);
            try {
                this._emailCollection = new EmailCollection(emails);
                if (emails) {
                    for (var _i = 0, emails_1 = emails; _i < emails_1.length; _i++) {
                        var email = emails_1[_i];
                        this._emailsView.renderEmailBlock(email, true);
                    }
                }
            }
            catch (e) {
                throw new Error('The list of emails you tried to instantiate contains invalid emails');
            }
        }
        /**
         * @function addEmail
         * Adds a valid email to the collection and renders appropriate blocks.
         * @param email
         */
        EmailInputComponent.prototype.addEmail = function (email) {
            if (!email) {
                throw new Error('Not possible to add new email, because the email is not present');
            }
            try {
                this._emailCollection.addEmail(email);
                this._emailsView.renderEmailBlock(email, true);
            }
            catch (_a) {
                this._emailsView.renderEmailBlock(email, false);
            }
        };
        /**
         * @function getValidEmailsCount
         * This function returns a count of all the valid emails.
         */
        EmailInputComponent.prototype.getValidEmailsCount = function () {
            alert(this._emailCollection.emailCollectionCount);
        };
        /**
         * @function deleteEmail
         * This function deletes an email from the collection after
         * getting the call through an click event on the valid / invalid email DOM element.
         */
        EmailInputComponent.prototype.deleteEmail = function (email) {
            if (!email) {
                throw new Error('Not possible to remove the email, email is passed incorrectly');
            }
            this._emailCollection.removeEmail(email);
        };
        /**
         * @function addEventListersInputHolder
         * This function adds all the needed eventlisteners to the divwrapper and utilizez
         * event delegation to handle all the events.
         * @param wrapperDiv
         */
        EmailInputComponent.prototype.addAllEventListeners = function (wrapperDiv) {
            var _this = this;
            [
                [
                    'paste',
                    function (event) {
                        var _a;
                        if (event.currentTarget === wrapperDiv) {
                            var pasteVal = (_a = event.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text/plain');
                            pasteVal.split(SettingsService.config.copyPasteSeparator).forEach(function (email) {
                                _this.addEmail(email);
                            });
                        }
                        event.preventDefault();
                    },
                    false,
                ],
                [
                    'focus',
                    function (event) {
                        wrapperDiv.classList.add(SettingsService.config.emailHolderFocusCSS);
                    },
                    true,
                ],
                [
                    'blur',
                    function (event) {
                        if (event.target.tagName === 'INPUT') {
                            var emailVal = event.target.value;
                            if (emailVal) {
                                _this.addEmail(emailVal);
                            }
                        }
                        wrapperDiv.classList.remove(SettingsService.config.emailHolderFocusCSS);
                    },
                    true,
                ],
                [
                    'click',
                    function (event) {
                        if (event.target.dataset.function === 'deleteEmail') {
                            var emailBlock = event.target.parentElement;
                            var mailVal = emailBlock.innerText;
                            if (emailBlock.dataset.validity !== 'false') {
                                _this.deleteEmail(mailVal);
                            }
                            emailBlock.remove();
                        }
                    },
                    false,
                ],
                [
                    'keydown',
                    function (event) {
                        if (event.key === 'Enter') {
                            var emailVal = event.target.value;
                            _this.addEmail(emailVal);
                        }
                        if (event.key === ',') {
                            event.preventDefault();
                            var emailVal = event.target.value;
                            _this.addEmail(emailVal);
                        }
                    },
                    false,
                ],
            ].forEach(function (val) {
                var eventType = val[0], eventHandler = val[1], useCapture = val[2];
                wrapperDiv.addEventListener(eventType, eventHandler, useCapture);
            });
        };
        return EmailInputComponent;
    }());

    return EmailInputComponent;

})));
