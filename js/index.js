"use strict";

(function () {
    // when page loading this function will be active
    $(function () {

        // declare this 2 variables for loading amount from server
        var minimumForServer = 0
        var maximumForServer = 100;

        //Get all coins and show them
        getAllData(minimumForServer, maximumForServer);
        //reset array of the chosen coins(made for the reason of api owner's changes)
        resetArray();
        // hide the about div
        $("#about").hide();
        //insert data into about page
        aboutPage();

        $("#loadMore").click(function () {
            minimumForServer += 100;
            maximumForServer += 100;
            getAllData(minimumForServer, maximumForServer);
        });

        //on home button click --> 
        $("#homeClick").click(function () {
            $("#about").hide();
            $("#chartContainer").hide();
            $("#coinsDivTitle").show();
            $("#displayCoinsMain").show();
            $("#coinsPage").show();
        });

        //on live chart page click-->
        $("#liveGraph").click(function () {
            $("#coinsDivTitle").hide();
            $("#coinsPage").hide();
            $("#displayCoinsMain").hide();
            $("#about").hide();
            getChartData();
        });

        //on about page click -->
        $("#aboutClick").click(function () {
            $("#coinsDivTitle").hide();
            $("#displayCoinsMain").hide();
            $("#chartContainer").hide();
            $("#coinsPage").hide();
            $("#about").show();
        });

        $("#coinsButtonSlideDown").click(function () {
            $("#displayCoinsMain").slideDown();
        })
        $("#coinsButtonSlideUp").click(function () {
            $("#displayCoinsMain").slideUp();
        })
        //create function for showing the chosen page
        function showPage(pageID) {
            $(".page").hide();
            $(pageID).show();
        };

        //reset the chosen page when the site is loading and insert home page for default
        location.hash = "";
        location.hash = "#displayCoinsMain";

        //on hash change show the current chosen page
        $(window).on("hashchange", function () {
            showPage(location.hash);
        });

        // show / hide the bottom and top buttons
        $("body").scroll(function () {
            let topPos = $(this).scrollTop();

            //check if scrolling from top is less or more then 600px
            if (topPos > 600) {
                $("#topBtn").css("display", "block");
                $("#loadMoreDiv").css("display", "block");
                $("#bottomBtn").css("display", "block");
            } else {
                $("#topBtn").css("display", "none");
                $("#loadMoreDiv").css("display", "none");
                $("#bottomBtn").css("display", "none");
            }
        })

        //hide bottom button when user scrolling to bottom
        $("body").scroll(function () {
            let topPos = $(this).scrollTop(); 

            //check if user scrolled to the bottom
            if (topPos === $(document).height() - $(window).height()) {
                $("#bottomBtn").css("display", "none");
            }
        })

        // event for top button click
        $("#topBtn").click(function () {
            $("html, body").animate({ scrollTop: 0 });
        })

        // event for bottom button click
        $("#bottomBtn").click(function () {
            $("html, body").animate({ scrollTop: $(document).height() - $(window).height() });
        })

        // clicking on the small right up div buttun activate the nav bar -->
        $("#menuActive").click(function () {
            $(".displayNav").stop().toggle(1000);
        });

    });



    //get the data and build the divs on html page 
    async function getAllData(minimumForServer, maximumForServer) {

        try {
            let allCoins = await fetchData("https://api.coingecko.com/api/v3/coins/list");

            for (var i = minimumForServer; i < maximumForServer; i++) {

                //validate if the request amount from server is more then 0

                if (i >= allCoins.length) {
                    $("#loadMore").css("display", "none");
                    continue;
                }

                var div = "<div class='col-sm-4 displayCoins'>";
                let coins = "<br><p style='text-transform: uppercase;color:black;text-align:left;'><b><font size='5' id=" + allCoins[i].symbol + ">" + allCoins[i].symbol + "</font></b></p><p style='text-align:left;'><font size='4' class='symbol'>" + allCoins[i].name + "</font></p><p hidden>" + allCoins[i].id + "</p>";
                let moreInfo = "<div class='moreInfo' style='z-index:1;text-align:left;'><button type='button' class='btn btn-outline-dark slideEffect moreInfoButton'>More Info</button></div>";
                let toggle = "<div class='toggle'><label class='switch'><input type='checkbox' class='curCheckBox'><span class='slider round'></span></label></div>";

                div += coins + moreInfo + toggle + "</div>";

                $("#displayCoinsMain").append(div);
            }

            var lastClick;
            var coinName;

            // adding an event when user are clicking on 'more info' button
            $(".moreInfoButton").unbind().on("click", function () {

                // check if the div is slide down
                if ($(this).hasClass("slideEffect")) {
                    $(this).removeClass("slideEffect");

                    var currentDiv = $(this).closest(".displayCoins");
                    coinName = $(currentDiv).children("p:nth-of-type(3)").text();

                    lastClick = new Date().getTime();

                    let getCache = sessionStorage.getItem("coinsDetails");
                    let getCoin = JSON.parse(getCache);

                    if (sessionStorage.getItem("coinsDetails")) {
                        for (let i in getCoin) {
                            if (coinName === getCoin[i].name) {

                                var newCoinName = getCoin[i].name;
                                var newCoinUsd = getCoin[i].usd;
                                var newCoinEur = getCoin[i].eur;
                                var newCoinIls = getCoin[i].usd;
                                var newClick = getCoin[i].click;

                            }
                        }
                        if (lastClick - newClick < 120000) {
                            return getCurrentCoinFromCache(currentDiv, newCoinUsd, newCoinEur, newCoinIls);
                        }
                        else {
                            popItemFromCache(newCoinName);
                            getCurrentCoin(coinName, currentDiv, lastClick);
                        }
                    }
                    else {
                        popItemFromCache(newCoinName);
                        getCurrentCoin(coinName, currentDiv, lastClick);
                    }
                }
                // if the div is slide down then slide it up
                else {
                    $(this).addClass("slideEffect");
                    $(this).offsetParent(currentDiv).children(".newDiv").stop().slideUp();
                }
            })

            // adding an event when user are clicking on 'toggle' button
            $('.curCheckBox').unbind().on("click", function () {

                //check if checkbox is checked 
                if ($(this).is(':checked')) {

                    //check if the localStorage exist and if it's more than 5 toggled divs
                    if (localStorage.getItem("coinsArrayForChart") && !validateToggle()) {

                        // pop the modal to let the user toggle off one or more div 
                        showModal();

                        // the current toggle clicked will remain unchecked
                        $(this).prop("checked", false);
                        return;
                    }

                    // when it's less than 5 toggled divs, add it to the local storage
                    let coinID = $(this).parent().parent().siblings("p:nth-of-type(3)").text();
                    let coinSymbol = $(this).parent().parent().siblings("p:nth-of-type(1)").text().toUpperCase();

                    setLocalStorageArray(coinID, coinSymbol);
                }
                // when the user toggled it off , pop this values off from local storage 
                else {
                    let coinID = $(this).parent().parent().siblings("p:nth-of-type(3)").text();
                    popIt(coinID);
                }
            });

            // adding an event on keyup search box
            $("#searchBox").unbind("keyup").keyup(function () {
                var value = $(this).val().toLowerCase();
                var items = $(".symbol");

                items.closest(".displayCoins").hide();

                if (value !== "") {
                    items.filter(function () {
                        return $(this).text().toLowerCase() === value;
                    }).closest(".displayCoins").show();
                }
                else {
                    items.closest(".displayCoins").show();
                }
            })


        }
        catch (error) {
            alert("something went wrong please try again .. " + "\nEroor Status: " + error.status);
        }
    }

    // validate if the user Select more than 5 coins
    function validateToggle() {
        let arrayLeng = localStorage.getItem("coinsArrayForChart");
        let arrayLengthCheck = JSON.parse(arrayLeng);

        if (arrayLengthCheck.length < 5) {
            return true;
        }
    }

    //if the user hits the 'more info' button after 2 minutes, this function will remove the coin from the array(session storage)
    //and will replace it with the same coin with new data
    function popItemFromCache(newCoinName) {

        let jsonObj = sessionStorage.getItem("coinsDetails");
        let allCoinsArray = JSON.parse(jsonObj);

        if (allCoinsArray === null) {
            allCoinsArray = [];
        }

        for (let i = 0; i < allCoinsArray.length; i++) {

            if (allCoinsArray[i].name === newCoinName) {
                allCoinsArray.splice(i, 1);
            }
        }

        sessionStorage.setItem('coinsDetails', JSON.stringify(allCoinsArray));
    }

    // if the user Select more than 5 coins , then show this modal wuth the current coins chosen
    function showModal() {
        let getCoins = localStorage.getItem("coinsArrayForChart");
        let coins = JSON.parse(getCoins);

        $("#modalBody").empty();

        for (let i = 0; i < coins.length; i++) {

            var div = "<div class='d-inline-block col-5 modalDivs' style='border:3px solid gray;padding: 3%;margin: 1%'><p style='text-align: left;'><b>" + coins[i].symbol + "</b></p><p style='text-align: left;'>" + coins[i].ID + "</p><div class='modalToggle'><label class='switch'><input type='checkbox' class='modalCurCheckBox d-inline-block' id=checkbox" + i + " checked><span class='slider round'></span></label></div></div>"

            $("#modalBody").append(div);
        }

        // adding an event when user clicks on toggle to remove coin from the list
        $(".modalCurCheckBox").on("click", function () {
            //if the user Select to add the coin to the list
            if ($(this).is(':checked')) {

                let coinID = $(this).parent().parent().siblings("p:nth-of-type(2)").text();
                let coinSymbol = $(this).parent().parent().siblings("p:nth-of-type(1)").text().toUpperCase();

                setLocalStorageArray(coinID, coinSymbol);
                //check for the the source div in the body page and mark it as toggeled
                $("#displayCoinsMain").children("div:contains('" + coinID + "')").children("div.toggle").children("label.switch").children("input.curCheckBox").prop("checked", true);
            }
            //if the user Select to remove this coin from the list
            else {
                let coinID = $(this).parent().parent().siblings("p:nth-of-type(2)").text();
                modalPopIt(coinID);
            }
        })

        $('#myModal').modal('show');
    }

    //function for remove coinf from the modal array by user selection
    function modalPopIt(coinID) {

        let jsonObj = localStorage.getItem("coinsArrayForChart");
        let allCoinsArray = JSON.parse(jsonObj);

        for (var i = 0; i < allCoinsArray.length; i++) {

            if (allCoinsArray[i].ID === coinID) {
                allCoinsArray.splice(i, 1);
            }
        }
        localStorage.setItem("coinsArrayForChart", JSON.stringify(allCoinsArray));
        $("#displayCoinsMain").children("div:contains('" + coinID + "')").children("div.toggle").children("label.switch").children("input.curCheckBox").prop("checked", false);
    }

    // funcion for fetching the data fromo the server with the Promise object
    async function fetchData(url) {
        let newPromise = new Promise((resolve, reject) => {

            // show the loader as long as the page loads the information for the user
            $("#wait").css("display", "block");

            //ajax call
            $.ajax({
                method: "GET",
                url: url,
                success: function (response) {
                    resolve(response);
                    $("#wait").css("display", "none");
                },
                error: function (error) {
                    reject(error.status);
                }
            });
        });
        return newPromise;
    }

    // insert data into cache (session array)
    function cache(coinImageUSD, coinImageEUR, coinImageILS, coinname, lastClickForCache) {

        let coinObject = {
            name: coinname,
            usd: coinImageUSD,
            eur: coinImageEUR,
            ils: coinImageILS,
            click: lastClickForCache
        };

        let jsonObj = sessionStorage.getItem("coinsDetails");
        let allCoinsArray = JSON.parse(jsonObj);

        if (allCoinsArray === null) {
            allCoinsArray = [];
        }

        allCoinsArray.push(coinObject);

        jsonObj = JSON.stringify(allCoinsArray);
        sessionStorage.setItem("coinsDetails", jsonObj);
    }

    // get data from the cache and build it in a new div
    function getCurrentCoinFromCache(currentDiv, newCoinUsd, newCoinEur, newCoinIls) {

        let usd = newCoinUsd;
        let eur = newCoinEur;
        let ils = newCoinIls;

        let newDiv = "<div style='margin:7px;background:orange;border:5px solid #555;border-radius:7px;overflow:auto;height:70px;position:absolute;' class='col-sm-10 newDiv'><p><b>Current currency value: </b></p>" + usd + eur + ils + "</div>";

        $(currentDiv).append(newDiv);
        $(newDiv).stop().slideDown();
    }

    // get coin price details from the server every 2 minutes and append it to the exist div
    async function getCurrentCoin(coinName, currentDiv, lastClick) {

        try {
            let currentCoin = await fetchData("https://api.coingecko.com/api/v3/coins/" + coinName);

            // validate image response from server different then null
            if (currentCoin.image.thumb === "missing_thumb.png") {
                currentCoin.image.thumb = "";
            }

            let coinImageUSD = "<img src='" + currentCoin.image.thumb + "'><b> $ </b><span>" + currentCoin.market_data.current_price.usd + "</span><br>";
            let coinImageEUR = "<img src='" + currentCoin.image.thumb + "'><b> € </b>" + currentCoin.market_data.current_price.eur + "<br>";
            let coinImageILS = "<img src='" + currentCoin.image.thumb + "'><b> &#8362 </b>" + currentCoin.market_data.current_price.ils + "<br>";

            //creating the new div with the data
            let newDiv = "<div style='margin:7px;background:orange;border:5px solid #555;border-radius:7px;overflow:auto;height:70px;position:absolute;' class='col-sm-10 newDiv'><p><b>Current currency value: </b></p>" + coinImageUSD + coinImageEUR + coinImageILS + "</div>";

            //appending the new div into the existing coin
            $(currentDiv).append(newDiv);
            $(newDiv).stop().slideDown();

            let lastClickForCache = lastClick;

            //cache this data to the session array for the next 2 minutes
            cache(coinImageUSD, coinImageEUR, coinImageILS, coinName, lastClickForCache);
        }
        catch{
            alert("something went wrong please try again .. " + "\nEroor Status: " + error.status);
        }
    }

    // set the local storage array for adding a new coin to the graph live show
    function setLocalStorageArray(coinID, coinSymbol) {

        let coinObj = {
            ID: coinID,
            symbol: coinSymbol
        }

        let jsonObj = localStorage.getItem("coinsArrayForChart");
        let allCoinsArray = JSON.parse(jsonObj);

        if (allCoinsArray === null) {
            allCoinsArray = [];
        }

        allCoinsArray.push(coinObj);

        jsonObj = JSON.stringify(allCoinsArray);
        localStorage.setItem("coinsArrayForChart", jsonObj);
    }

    //when the user uncheck the toggle button , remove the coin from the array
    function popIt(coinID) {

        let jsonObj = localStorage.getItem("coinsArrayForChart");
        let allCoinsArray = JSON.parse(jsonObj);

        for (var i = 0; i < allCoinsArray.length; i++) {

            if (allCoinsArray[i].ID === coinID) {
                allCoinsArray.splice(i, 1);
            }
        }
        localStorage.setItem("coinsArrayForChart", JSON.stringify(allCoinsArray));
    }

    //reset the array on site loading. 
    //problem: the api always changing and the coins list limmited to 100 coins.
    //resolve: the array is reset every time the user getting off the site and loading it again after a while;

    function resetArray() {

        let coinsArray = localStorage.getItem("coinsArrayForChart");
        var coinsArrayForReset = JSON.parse(coinsArray);

        if (coinsArrayForReset === null) {
            coinsArrayForReset = [];
        }

        while (coinsArrayForReset.length > 0) {
            coinsArrayForReset.pop();
        }

        coinsArray = JSON.stringify(coinsArrayForReset);
        localStorage.setItem("coinsArrayForChart", coinsArray);
    }

    // fetching data from the server for the chart.
    //created a new function for the chart without the loading image so it will not show every 2 seconds.
    async function fetchDataForChart(url) {
        let newPromise = new Promise((resolve, reject) => {

            $.ajax({
                method: "GET",
                url: url,
                success: function (response) {
                    resolve(response);
                },
                error: function (error) {
                    reject(error.status);
                }
            });
        });
        return newPromise;
    }

    // the live graph chart function
    async function getChartData() {
        //get the coins from the local storage 
        let array = localStorage.getItem("coinsArrayForChart");
        let coinsNames = JSON.parse(array);

        let urlForAjax = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=";
        var currentCoinNameForChart = "";

        //build the api request with the coins from the local storage
        for (let i = 0; i < coinsNames.length; i++) {
            urlForAjax += coinsNames[i].symbol + ",";
            currentCoinNameForChart += (coinsNames[i].symbol + " ");
        }
        // split the variable with the coins names so we can be able to get the coins names for the chart title
        var result = currentCoinNameForChart.split(" ");

        urlForAjax += "&tsyms=USD";

        //get the current coins and insert in a variable for text legend in the chart
        let allCoins = await fetchDataForChart(urlForAjax);
        var coinsNameForChartLegend = "";

        for (let coin in allCoins) {
            coinsNameForChartLegend += (coin) + " ";
        }

        var textResultForChartLegend = coinsNameForChartLegend.split(" ");

        //check if the first response different then coin name("Response" means the response from server)
        // happens because of the multiprice api doesn't return a reply with price for all currencies 
        if (textResultForChartLegend[0] === "Response") {
            for (let i = 0; i < textResultForChartLegend.length; i++) {
                textResultForChartLegend[i] = "unavailable";
            }
            if (coinsNames.length > 0) {
                var addAsteriskForNote = true;
            }
        }

        for (let i = 0; i < textResultForChartLegend.length; i++) {

            if (result.length > textResultForChartLegend.length && textResultForChartLegend[0] !== "no data") {
                var addAsteriskForNote = true;
            }

        }

        //add asterisk for the chart title in case of price data is not available for one or more of the coins 
        if (addAsteriskForNote) {
            currentCoinNameForChart += "*"
        }

        var curCoinsWithDataPriceAvailable = "";
        //get the current coins with data price available and insert it into a variable
        for (var i = 0; i < result.length; i++) {
            for (var j = 0; j < textResultForChartLegend.length; j++) {

                if (result[i] === textResultForChartLegend[j]) {
                    curCoinsWithDataPriceAvailable += (textResultForChartLegend[j]) + " ";
                }
            }
        }

        let dataPoints0 = [];
        let dataPoints1 = [];
        let dataPoints2 = [];
        let dataPoints3 = [];
        let dataPoints4 = [];

        if (currentCoinNameForChart.length < 1) {
            currentCoinNameForChart = "No coins checked.."
        } else {
            currentCoinNameForChart += " To USD"
        }

        // set the variable for axisX text title
        var textForChartAxisXTitle;
        if (curCoinsWithDataPriceAvailable.length > 0) {
            textForChartAxisXTitle = "*data available for the coins: "
        }
        else {
            if (currentCoinNameForChart === "No coins checked..") {
                textForChartAxisXTitle = "";
            }
            else {
                textForChartAxisXTitle = "*data is not available for selected coins"
            }
        }

        // set timout for all chart when user first clicks on chart in menu to resolve width isssues
        setTimeout(async function () {
            var chart = new CanvasJS.Chart("chartContainer", {
                zoomEnabled: true,
                zoomType: "xy",
                toolTip: {
                    content: "{legendText}: {y}"
                },
                title: {
                    borderThickness: 2,
                    cornerRadius: 4,
                    margin: 10,
                    padding: 3,
                    borderColor: "green",
                    fontWeight: "lighter",
                    fontSize: 30,
                    verticalAlign: "top",
                    horizontalAlign: "center",
                    dockInsidePlotArea: false,
                    wrap: false,
                    backgroundColor: "#f4d5a6",
                    fontFamily: "Calibri",
                    text: currentCoinNameForChart
                },
                axisY: {
                    title: "coin value",
                    titleFontFamily: "Calibri",
                    includeZero: true,
                    labelFontSize: 20,
                    labelFontColor: "dimGrey",
                    labelAutoFit: true,
                    labelAngle: -15,
                    valueFormatString: "#,##0.####",
                    prefix: "$",
                    tickColor: "darkorange",
                    lineColor: "darkblue",
                    lineThickness: 3,
                    tickLength: 10,
                    gridThickness: 1,
                    lineDashType: "dot",
                    gridDashType: "dot",
                    crosshair: {
                        enabled: true,
                        snapToDataPoint: false,
                        color: "#33558B",
                        labelBackgroundColor: "#33558B",
                        opacity: 1.5,
                        thickness: 2,
                        lineDashType: "dot",
                        labelFontColor: "orange",
                        valueFormatString: "#,##0.####",
                        labelFormatter: function (e) {
                            return "$" + CanvasJS.formatNumber(e.value, "#,##0.####");
                        }
                    },
                },
                axisX: {
                    //adding the notice for user to know that data price is not available for all of the coins
                    title: textForChartAxisXTitle + " " + curCoinsWithDataPriceAvailable,
                    // xValueType: "dateTime",
                    titleWrap: true,
                    titleFontColor: "red",
                    titleFontFamily: "Calibri",
                    titleFontWeight: "bold",
                    titleFontSize: 15,
                    labelAutoFit: true,
                    viewportMinimum: new Date(),
                    tickLength: 5,
                    tickColor: "orange",
                    prefix: "",
                    labelFontSize: 20,
                    labelFontColor: "dimGrey",
                    labelAngle: -30,
                    lineColor: "darkgreen",
                    lineThickness: 3,
                    tickLength: 10,
                    lineDashType: "dot",
                    gridDashType: "dot",
                    gridThickness: 2,
                    interlacedColor: "#FEFDDF",
                    gridThickness: 2,
                    gridColor: "gray",
                    crosshair: {
                        enabled: true,
                        snapToDataPoint: false,
                        color: "#33558B",
                        labelBackgroundColor: "#33558B",
                        opacity: 1.5,
                        thickness: 2,
                        lineDashType: "dot",
                        labelFontColor: "gray",
                    },
                },
                data: [{
                    type: "line",
                    axisXIndex: 0,
                    dataPoints: dataPoints0,
                    showInLegend: true,
                    name: " unavailable",
                    legendText: textResultForChartLegend[0],
                }, {
                    type: "line",
                    axisXIndex: 1,
                    dataPoints: dataPoints1,
                    showInLegend: true,
                    name: " unavailable",
                    legendText: textResultForChartLegend[1]
                }, {
                    type: "line",
                    axisXIndex: 2,
                    dataPoints: dataPoints2,
                    showInLegend: true,
                    name: " unavailable",
                    legendText: textResultForChartLegend[2]
                }, {
                    type: "line",
                    axisXIndex: 3,
                    dataPoints: dataPoints3,
                    showInLegend: true,
                    name: " unavailable",
                    legendText: textResultForChartLegend[3]
                }, {
                    type: "line",
                    axisXIndex: 4,
                    dataPoints: dataPoints4,
                    showInLegend: true,
                    name: " unavailable",
                    legendText: textResultForChartLegend[4]
                }]
            });
            chart.render();

            //create another function for chart's points update and insert it into a variable 
            var updateChart = async function () {

                let allCoins = await fetchDataForChart(urlForAjax);

                let coinsPriceForChart = [];
                //get the current coins price and insert it into array
                for (let coin in allCoins) {
                    coinsPriceForChart.push(allCoins[coin].USD);
                }
                //insert the array data into variables and push this variables data into the y points chart arrays
                let yVal0 = coinsPriceForChart[0];

                //insert the current date into variables and push this variables data into the x labels chart arrays
                var date = new Date();

                dataPoints0.push({
                    x: date,
                    y: yVal0
                });
                
                let yVal1 = coinsPriceForChart[1];

                dataPoints1.push({
                    x: date,
                    y: yVal1
                });

                let yVal2 = coinsPriceForChart[2];

                dataPoints2.push({
                    x: date,
                    y: yVal2
                });

                let yVal3 = coinsPriceForChart[3];

                dataPoints3.push({
                    x: date,
                    y: yVal3
                });

                let yVal4 = coinsPriceForChart[4];

                dataPoints4.push({
                    x: date,
                    y: yVal4
                });

                chart.render();
                
            };

            //check if the coins length bigger then 0 and 
            if (coinsNames.length > 0 && curCoinsWithDataPriceAvailable.length > 0) {
                // update chart every 2 seconds
                setInterval(function () { updateChart() }, 2000);
            }

        }, 50);
    }
    //insert data into the About page
    function aboutPage() {
        $("#about").append("<div class='myPic'><img src='assets/images/myPicMosheOz.jpg' width=100%></div><div style='vertical-align:top;text-align:center;display:inline-block;border:3px solid gray;margin:1%;background:white' class='col-5'><p><b>site fetures: </b></p>" +
            '<p>The site was built with the following technologies: ' +
            '<b>HTML5, CSS3, BOOTSTRAP, JavaScript and jQuery.</b></p>' +
            '<p><b>containes:</b>' +
            ' Dynamic page layouts, Callbacks, Promises, Async, Await, Single Page Aplication, Events, Ajax (RESTful API), Documentation.</p>' +
            '<p><b>Site content:</b></p>' +
            '<p>On the site opening (home page) ,the user receives 100 different crypto coins, in which he can view their real prices in real time by dedicated button.' +
            'In addition, a small tab is placed on top of each coin.</p>' +
            '<p>The Graph page:' +
            'Showing a graph showing the price of selected currencies chosen by Heuser in the form of a rising graph</p>' +
            '</div>');
    }
})();

