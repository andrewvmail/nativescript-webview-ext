import * as TKUnit from "../../TKUnit";
import * as testModule from "../../ui-test";

// >> webview-require
import { LoadEventData, WebViewExt } from "@nota/nativescript-webview-ext";
// << webview-require

import { Color } from "tns-core-modules/color";
import * as fs from "tns-core-modules/file-system";
import * as url from "url";
import { DoneCallback } from "../../TKUnit";

// >> declare-webview-xml
//  <Page>
//       {%raw%}<WebView src="{{ someUrl | pathToLocalFile | htmlString }}" />{%endraw%}
//  </Page>
// << declare-webview-xml

function timeoutPromise(delay = 100) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

// HTML test files
const emptyHTMLFile = "~/ui/web-view/assets/html/empty.html";
const javascriptCallsFile = "~/ui/web-view/assets/html/javascript-calls.html";
const javascriptCallsXLocalFile = "~/ui/web-view/assets/html/javascript-calls-x-local.html";
const cssNotPredefinedFile = "~/ui/web-view/assets/html/css-not-predefined.html";
const cssPreDefinedlinkFile = "~/ui/web-view/assets/html/css-predefined-link-tags.html";

// Resource loads
const localStyleSheetCssNAME = "local-stylesheet.css";
const localStyleSheetCssFile = "~/ui/web-view/assets/css/local-stylesheet.css";

const localJavaScriptName = "local-javascript.js";
const localJavaScriptFile = "~/ui/web-view/assets/js/local-javascript.js";

const jsGetElementStyleSheet = `
(function() {
    const els = document.getElementsByClassName('red');
    if (!els.length) {
        return 'Element not found';
    }

    var el = els[0];

    var style = window.getComputedStyle(el);
    var result = {};

    Object.keys(style)
        .filter(function(key) {
            return isNaN(key);
        })
        .forEach(function(key) {
            result[key] = style[key];
        });

    return result;
})();
`;

export class WebViewTest extends testModule.UITest<WebViewExt> {
    public create(): WebViewExt {
        // >> declare-webview
        const webView = new WebViewExt();
        webView.debugMode = true;
        // << declare-webview
        return webView;
    }

    public testLoadExistingUrl(done: DoneCallback) {
        const webView = this.testView;

        const targetSrc = "https://github.com/";

        // >> webview-existing-url
        webView.on(WebViewExt.loadFinishedEvent, (args: LoadEventData) => {
            // >> (hide)
            try {
                TKUnit.assertNull(args.error, args.error);
                TKUnit.assertDeepEqual(url.parse(args.url), url.parse(targetSrc), "args.url");
                done();
            } catch (err) {
                done(err);
            }

            // << (hide)
        });
        webView.src = targetSrc;
        // << webview-existing-url
    }

    public async testLoadExistingUrlWithPromise(done: DoneCallback) {
        const webView = this.testView;

        const targetSrc = "https://github.com/";

        // >> webview-existing-url-via-promise
        try {
            const args = await webView.loadUrl(targetSrc);

            // >> (hide)
            try {
                TKUnit.assertNull(args.error, args.error);
                TKUnit.assertDeepEqual(url.parse(args.url), url.parse(targetSrc), "args.url");
                done();
            } catch (err) {
                done(err);
            }

            // << (hide)
        } catch (err) {
            done(err);
        }
        // << webview-existing-url-via-promise
    }

    public testLoadLocalFile(done: DoneCallback) {
        const webView = this.testView;

        const targetSrc = "~/ui/web-view/test.html";

        // >> webview-localfile
        webView.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)
            const actualTitle = await webView.getTitle();
            const expectedTitle = "MyTitle";

            try {
                TKUnit.assertNull(args.error, args.error);
                TKUnit.assertEqual(actualTitle, expectedTitle, `File "${targetSrc}" not loaded properly.`);
                done();
            } catch (err) {
                done(err);
            }
            // << (hide)
        });
        webView.src = targetSrc;
        // << webview-localfile
    }

    public testLoadLocalFileWithSpaceInPath(done: DoneCallback) {
        const webview = this.testView;

        // >> webview-localfile-with-space
        const targetSrc = "~/ui/web-view/test with spaces.html";
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            const actualTitle = await webview.getTitle();
            const expectedTitle = "MyTitle";

            try {
                TKUnit.assertNull(args.error, args.error);
                TKUnit.assertEqual(actualTitle, expectedTitle, `File "${targetSrc}" not loaded properly.`);
                done();
            } catch (err) {
                done(err);
            }
        });

        webview.src = targetSrc;
        // << webview-localfile-with-space
    }

    public testLoadHTMLString(done: DoneCallback) {
        const webview = this.testView;

        // >> webview-string
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)
            const actualTitle = await webview.getTitle();
            const expectedTitle = "MyTitle";

            try {
                TKUnit.assertNull(args.error, args.error);
                TKUnit.assertEqual(actualTitle, expectedTitle, "HTML string not loaded properly. Actual: ");
                done();
            } catch (err) {
                done(err);
            }
            // << (hide)
        });
        webview.src =
            '<!DOCTYPE html><html><head><title>MyTitle</title><meta charset="utf-8" /></head><body><span style="color:red">TestÖ</span></body></html>';
        // << webview-string
    }

    public async testLoadHTMLStringPromise(done: DoneCallback) {
        const webview = this.testView;

        // >> webview-string-promise
        const html = '<!DOCTYPE html><html><head><title>MyTitle</title><meta charset="utf-8" /></head><body><span style="color:red">TestÖ</span></body></html>';
        try {
            const args = await webview.loadUrl(html);
            // >> (hide)
            const actualTitle = await webview.getTitle();
            const expectedTitle = "MyTitle";

            TKUnit.assertNull(args.error, args.error);
            TKUnit.assertEqual(actualTitle, expectedTitle, "HTML string not loaded properly. Actual: ");
            done();
            // << (hide)
        } catch (err) {
            done(err);
        }
        // << webview-string-promise
    }

    public testLoadSingleXLocalFile(done: DoneCallback) {
        const webview = this.testView;

        const emptyHTMLXLocalSource = "x-local://empty.html";

        webview.registerLocalResource("empty.html", emptyHTMLFile);

        // >> webview-x-localfile
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)
            const expectedTitle = "Blank";
            const actualTitle = await webview.getTitle();

            try {
                TKUnit.assertNull(args.error, args.error);
                TKUnit.assertEqual(actualTitle, expectedTitle, `File "${emptyHTMLXLocalSource}" not loaded properly.`);
                done();
            } catch (err) {
                done(err);
            }
            // << (hide)
        });
        webview.src = emptyHTMLXLocalSource;
        // << webview-x-localfile
    }

    public async testLoadSingleXLocalFilePromise(done: DoneCallback) {
        const webview = this.testView;

        const emptyHTMLXLocalSource = "x-local://empty.html";

        // >> webview-x-localfile-promise
        try {
            webview.registerLocalResource("empty.html", emptyHTMLFile);

            const args = await webview.loadUrl(emptyHTMLXLocalSource);
            // >> (hide)
            const expectedTitle = "Blank";
            const actualTitle = await webview.getTitle();

            TKUnit.assertNull(args.error, args.error);
            TKUnit.assertEqual(actualTitle, expectedTitle, `File "${emptyHTMLXLocalSource}" not loaded properly.`);
            done();
            // << (hide)
        } catch (err) {
            done(err);
        }
        // << webview-x-localfile-promise
    }

    public testInjectFilesPredefinedStyleSheetLink(done: DoneCallback) {
        const webview = this.testView;

        const expectedRedColor = new Color("rgb(0, 128, 0)");

        webview.registerLocalResource(localStyleSheetCssNAME, localStyleSheetCssFile);

        // >> webview-x-local-predefined-link
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)
            const expectedTitle = "Load predefined x-local stylesheet";

            try {
                TKUnit.assertNull(args.error, args.error);

                const actualTitle = await webview.getTitle();
                TKUnit.assertEqual(actualTitle, expectedTitle, `File "${cssPreDefinedlinkFile}" not loaded properly.`);

                const styles = await webview.executeJavaScript<any>(jsGetElementStyleSheet);
                TKUnit.assertNotNull(styles, `Couldn't load styles`);
                TKUnit.assertEqual(new Color(styles.color).hex, expectedRedColor.hex, `div.red isn't red`);

                done();
            } catch (err) {
                done(err);
            }
            // << (hide)
        });
        webview.src = cssPreDefinedlinkFile;
        // << webview-x-local-predefined-link
    }

    public testInjectFilesStyleSheetLink(done: DoneCallback) {
        const webview = this.testView;

        const expectedRedColor = new Color("rgb(0, 128, 0)");

        webview.registerLocalResource(localStyleSheetCssNAME, localStyleSheetCssFile);

        // >> webview-x-local-inject-css-link
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)
            const expectedTitle = "Inject stylesheet via x-local";

            try {
                const actualTitle = await webview.getTitle();
                TKUnit.assertNull(args.error, args.error);
                TKUnit.assertEqual(actualTitle, expectedTitle, `File "${cssNotPredefinedFile}" not loaded properly.`);

                await webview.loadStyleSheetFile(localStyleSheetCssNAME, localStyleSheetCssFile);
                await timeoutPromise();

                const styles = await webview.executeJavaScript<any>(jsGetElementStyleSheet);
                TKUnit.assertNotNull(styles, `Couldn't load styles`);
                TKUnit.assertEqual(new Color(styles.color).hex, expectedRedColor.hex, `div.red isn't red`);
                done();
            } catch (err) {
                done(err);
            }
            // << (hide)
        });
        webview.src = cssNotPredefinedFile;
        // << webview-x-local-inject-css-link
    }

    public testInjectJavaScriptOnce(done: DoneCallback) {
        const webview = this.testView;

        webview.registerLocalResource(localJavaScriptName, localJavaScriptFile);

        // >> webview-x-local-inject-once
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)
            const expectedTitle = "Blank";

            try {
                const actualTitle = await webview.getTitle();
                TKUnit.assertNull(args.error, args.error);
                TKUnit.assertEqual(actualTitle, expectedTitle, `File "${javascriptCallsXLocalFile}" not loaded properly.`);

                await webview.loadJavaScriptFile(localJavaScriptName, localJavaScriptFile);
                await timeoutPromise();

                TKUnit.assertEqual(await webview.executeJavaScript(`getNumber()`), 42);
                done();
            } catch (err) {
                done(err);
            }
            // << (hide)
        });
        webview.src = javascriptCallsXLocalFile;
        // << webview-x-local-inject-once
    }

    public testInjectJavaScriptAutoLoad(done: DoneCallback) {
        const webview = this.testView;

        webview.autoLoadJavaScriptFile(localJavaScriptName, localJavaScriptFile);

        const sources = [javascriptCallsXLocalFile, emptyHTMLFile];
        let targetSrc = sources.pop();

        // >> webview-autoload-javascript
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)
            try {
                TKUnit.assertNull(args.error, args.error);

                await timeoutPromise();

                TKUnit.assertEqual(await webview.executeJavaScript(`getNumber()`), 42, `Failed to get number 42 from "${targetSrc}"`);

                targetSrc = sources.pop();
                if (targetSrc) {
                    webview.src = targetSrc;
                } else {
                    done();
                }
            } catch (err) {
                done(err);
            }
            // << (hide)
        });

        webview.src = targetSrc;
        // << webview-autoload-javascript
    }

    // Testing JavaScript Bridge

    /**
     * Tests event callback by triggering an event in the webview that emits an event to the nativescript layer.
     */
    public testWebViewBridgeEvents(done: DoneCallback) {
        const webview = this.testView;

        const expected = {
            huba: "hop",
        };

        webview.on("web-message", (args: any) => {
            try {
                const data = args.data;
                TKUnit.assertDeepEqual(data, expected);
                done();
            } catch (err) {
                done(err);
            }

            webview.off("web-message");
        });

        // >> webview-bridge-events
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)

            try {
                TKUnit.assertNull(args.error, args.error);

                await webview.executeJavaScript(`setupEventListener()`);
                await timeoutPromise();
                webview.emitToWebView("tns-message", expected);
            } catch (err) {
                done(err);
            }
            // << (hide)
        });

        webview.src = javascriptCallsFile;
        // << webview-bridge-events
    }

    /**
     * Test calling a function that returns an integer
     */
    public testWebViewJavaScriptGetNumber(done: DoneCallback) {
        this.runWebViewJavaScriptInterfaceTest(done, "getNumber()", 42, "The answer to the ultimate question of life, the universe and everything");
    }

    /**
     * Test calling a function that returns a floating number
     */
    public testWebViewJavaScriptGetNumberFloat(done: DoneCallback) {
        this.runWebViewJavaScriptInterfaceTest(done, "getNumberFloat()", 3.14, "Get pi");
    }

    /**
     * Test calling a function that returns a boolean - true
     */
    public testWebViewJavaScriptGetBoeleanTrue(done: DoneCallback) {
        this.runWebViewJavaScriptInterfaceTest(done, "getTruth()", true, "Get boolean - true");
    }

    /**
     * Test calling a function that returns a boolean - false
     */
    public testWebViewJavaScriptGetBoeleanFalse(done: DoneCallback) {
        this.runWebViewJavaScriptInterfaceTest(done, "getFalse()", false, "Get boolean - false");
    }

    /**
     * Test calling a function that returns a string
     */
    public testWebViewJavaScriptGetString(done: DoneCallback) {
        this.runWebViewJavaScriptInterfaceTest(done, "getString()", "string result from webview JS function", "string result from webview JS function");
    }

    /**
     * Test calling a function that returns an array
     */
    public testWebViewJavaScriptGetArray(done) {
        this.runWebViewJavaScriptInterfaceTest(done, "getArray()", [1.5, true, "hello"], "getArray()");
    }

    /**
     * Test calling a function that returns an object
     */
    public testWebViewJavaScriptGetObject(done: DoneCallback) {
        this.runWebViewJavaScriptInterfaceTest(done, "getObject()", { prop: "test", name: "object-test", values: [42, 3.14] }, "getObject()");
    }

    /**
     * Helper function for calling a javascript function in the webview and getting the value.
     */
    private runWebViewJavaScriptInterfaceTest<T>(done: DoneCallback, scriptCode: string, expected: T, msg: string) {
        const webview = this.testView;

        // >> webview-interface-tests
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)

            try {
                TKUnit.assertNull(args.error, args.error);

                TKUnit.assertDeepEqual(await webview.executeJavaScript(scriptCode), expected, msg);
                done();
            } catch (err) {
                done(err);
            }
            // << (hide)
        });

        webview.src = javascriptCallsFile;
        // << webview-interface-tests
    }

    /**
     * Test calls in the WebView that resolves or rejects a promise.
     */
    public testWebViewJavaScriptPromiseInterface(done: DoneCallback) {
        const webview = this.testView;

        // >> webview-promise
        webview.on(WebViewExt.loadFinishedEvent, async (args: LoadEventData) => {
            // >> (hide)

            try {
                TKUnit.assertNull(args.error, args.error);

                TKUnit.assertDeepEqual(await webview.executePromise(`testPromiseResolve()`), 42, "Resolve promise");
            } catch (err) {
                done(err);
                return;
            }

            let rejectErr: Error = null;
            try {
                await webview.executePromise(`testPromiseReject()`);
            } catch (err) {
                rejectErr = err;
            }

            try {
                TKUnit.assertNotNull(rejectErr);

                TKUnit.assertEqual(rejectErr.message, "The Cake is a Lie");
                done();
            } catch (err) {
                done(err);
            }

            // << (hide)
        });

        webview.src = javascriptCallsFile;
        // << webview-promise
    }

    public async testAutoExecuteJavaScript(done: DoneCallback) {
        const webview = this.testView;

        const expectedMessage = `${new Date()}`;
        let gotMessage = false;
        webview.on("tns-message", (args) => {
            const actualMessage = args.data;
            TKUnit.assertEqual(actualMessage, expectedMessage, `Message on load`);
            gotMessage = true;
        });

        // >> webview-auto-exec-javascript
        try {
            webview.autoExecuteJavaScript(
                `new Promise(function(resolve) {
                // console.log('FIRST_PROMISE');
                window.nsWebViewBridge.emit("tns-message", ${JSON.stringify(expectedMessage)});

                setTimeout(resolve, 50);
            }).then(function() {
                window.firstPromiseResolved = true;
            });`,
                "tns-message",
            );

            webview.autoExecuteJavaScript(
                `new Promise(function(resolve, reject) {
                // console.log('SECOND_PROMISE: ' + !!window.firstPromiseResolved);
                if (!window.firstPromiseResolved) {
                    reject(new Error('First promise not resolved'));
                    return;
                }
                resolve();
            }).then(function() {
                window.secondPromiseResolved = true;
            });`,
                "tns-message-2",
            );

            webview.autoExecuteJavaScript(
                `new Promise(function(resolve, reject) {
                // console.log('THIRD_PROMISE: ' + !!window.secondPromiseResolved);
                if (!window.secondPromiseResolved) {
                    reject(new Error('Second promise not resolved'));
                    return;
                }
                resolve();
            });`,
                "tns-message-3",
            );

            const args = await webview.loadUrl(emptyHTMLFile);

            // >> (hide)
            const expectedTitle = "Blank";
            const actualTitle = await webview.getTitle();

            TKUnit.assertNull(args.error, args.error);
            TKUnit.assertEqual(actualTitle, expectedTitle, `File "${emptyHTMLFile}" not loaded properly.`);
            TKUnit.assertEqual(gotMessage, true, `tns-message emitted before load finished`);
            // << (hide)

            done();
        } catch (err) {
            done(err);
        }
        // << webview-auto-exec-javascript
    }

    public testLoadUpperCaseSrc(done: DoneCallback) {
        const webview = this.testView;
        const targetSrc = "HTTPS://github.com/";

        // >> webview-UPPER_CASE
        webview.on(WebViewExt.loadFinishedEvent, (args: LoadEventData) => {
            try {
                TKUnit.assertNull(args.error, args.error);
                TKUnit.assertDeepEqual(url.parse(args.url), url.parse(targetSrc), "args.url");
                done();
            } catch (err) {
                done(err);
            }
        });

        webview.src = targetSrc;
        // >> webview-UPPER_CASE
    }

    public async testXlocalXHR(done: DoneCallback) {
        const webview = this.testView;

        // >> webview-x-localfile-xhr
        try {
            webview.registerLocalResource(localStyleSheetCssNAME, localStyleSheetCssFile);

            let filepath = localStyleSheetCssFile;
            if (filepath.startsWith("~")) {
                filepath = fs.path.normalize(fs.knownFolders.currentApp().path + filepath.substr(1));
            }

            if (filepath.startsWith("file://")) {
                filepath = filepath.replace(/^file:\/\//, "");
            }

            const expectedData = await fs.File.fromPath(filepath).readText();

            webview.autoExecuteJavaScript(
                `
                (function(window) {
                    window.makeRequestPromise = function(obj) {
                        return new Promise(function(resolve, reject) {
                            var xhr = new XMLHttpRequest();
                            xhr.open(obj.method || "GET", obj.url);

                            xhr.onload = function() {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    resolve(xhr.response);
                                } else {
                                    reject(new Error('StatusCode: ' + xhr.status));
                                }
                            };

                            xhr.onerror = function(err) {
                                reject(err || xhr.status);
                            };

                            xhr.send(obj.body);
                        });
                    };
                })(window);`,
                "make-request-fn",
            );

            const args = await webview.loadUrl(emptyHTMLFile);

            // >> (hide)
            const expectedTitle = "Blank";
            const actualTitle = await webview.getTitle();

            TKUnit.assertNull(args.error, args.error);
            TKUnit.assertEqual(actualTitle, expectedTitle, `File "${emptyHTMLFile}" not loaded properly.`);

            const actualData = (await webview.executePromise<string>(`makeRequestPromise({url: 'x-local://${localStyleSheetCssNAME}'})`)) || "";

            TKUnit.assertEqual(actualData.trim(), expectedData.trim(), `Ajax filecontent not the same`);
            // << (hide)

            done();
        } catch (err) {
            done(err);
        }
        // << webview-x-localfile-xhr
    }

    public async testXlocalFetch(done: DoneCallback) {
        const webview = this.testView;

        // >> webview-x-localfile-fetch
        try {
            webview.registerLocalResource(localStyleSheetCssNAME, localStyleSheetCssFile);

            let filepath = localStyleSheetCssFile;
            if (filepath.startsWith("~")) {
                filepath = fs.path.normalize(fs.knownFolders.currentApp().path + filepath.substr(1));
            }

            if (filepath.startsWith("file://")) {
                filepath = filepath.replace(/^file:\/\//, "");
            }

            const expectedData = await fs.File.fromPath(filepath).readText();

            const args = await webview.loadUrl(emptyHTMLFile);

            // >> (hide)
            const expectedTitle = "Blank";
            const actualTitle = await webview.getTitle();

            TKUnit.assertNull(args.error, args.error);
            TKUnit.assertEqual(actualTitle, expectedTitle, `File "${emptyHTMLFile}" not loaded properly.`);

            const fetchUrl = `x-local://${localStyleSheetCssNAME}`;
            const actualData = await webview.executePromise<string>(
                `
                fetch(${JSON.stringify(fetchUrl)})
                    .then(function(response) {
                        const statusCode = response.status;
                        if (statusCode >= 200 && statusCode < 300) {
                            return response.text();
                        }

                        return Promise.reject("StatusCode: " + statusCode);
                    })
            `,
            );

            TKUnit.assertEqual(actualData.trim(), expectedData.trim(), `Ajax filecontent not the same`);
            // << (hide)

            done();
        } catch (err) {
            done(err);
        }
        // << webview-x-localfile-fetch
    }
}

export function createTestCase(): WebViewTest {
    return new WebViewTest();
}
