function recalculate() 
{
var theCalculator = document.forms.calculator;
var f=parseFloat(theCalculator.elements.flour.value);
var w=parseFloat(theCalculator.elements.water.value);
var s=parseFloat(theCalculator.elements.starter.value);
theCalculator.elements.total.value=w+f+s+0.02*(w+s/2)
theCalculator.elements.hydration.value=100*(w+s/2)/(f+s/2+0.02*(w+s/2))
theCalculator.elements.starter_proportion.value=s/(f+s/2)*100
displayValues()
}

function displayValues() {
var theCalculator = document.forms.calculator;
theCalculator.elements.salt.value=(parseFloat(theCalculator.elements.flour.value)+0.5*parseFloat(theCalculator.elements.starter.value))*0.02
document.getElementById('salt_amount').innerHTML = theCalculator.elements.salt.value+" g"
document.getElementById('flour_amount').innerHTML = theCalculator.elements.flour.value+" g"
document.getElementById('water_amount').innerHTML = theCalculator.elements.water.value+" g"
document.getElementById('starter_amount').innerHTML = theCalculator.elements.starter.value+" g"
document.getElementById('total_amount').innerHTML = theCalculator.elements.total.value+" g"
document.getElementById('hydration_value').innerHTML = theCalculator.elements.hydration.value+"%"
document.getElementById('starter_proportion_value').innerHTML = theCalculator.elements.starter_proportion.value+"%"
setCookies();
}
function recalculateIngredients() 
{
var theCalculator = document.forms.calculator;
var t=parseFloat(theCalculator.elements.total.value)
var h=parseFloat(theCalculator.elements.hydration.value)/100
var p=parseFloat(theCalculator.elements.starter_proportion.value)/100
theCalculator.elements.flour.value=-25*(p*t-2*t)/(50*h+51)
theCalculator.elements.water.value=25*(2*h*t-p*t)/(50*h+51)
theCalculator.elements.starter.value=50*p*t/(50*h+51)
displayValues()
}
function setCookies(key,value)
{
var elements = document.forms.calculator.elements;
for (i = 0; i < elements.length; i++) {
  document.cookie=elements[i].name+"="+elements[i].value;
}
console.log(document.cookie)
}
function getCookies() {
    console.log('getting cookies');
    var theCalculator = document.forms.calculator;
    // Split cookie string and get all individual name=value pairs in an array
    var cookieArr = document.cookie.split(";");
    // Loop through the array elements
    for(var i = 0; i < cookieArr.length; i++) {
        var cookiePair = cookieArr[i].split("=");
        console.log(cookiePair);
        if (theCalculator.elements[cookiePair[0].trim()]) {
        theCalculator.elements[cookiePair[0].trim()].value=cookiePair[1];}
    }
    recalculate()
}
window.onload = getCookies;
