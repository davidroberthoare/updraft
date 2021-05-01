// toast notifications
function doToast(msg, autoclose){
    $("#toast_text").html(msg);
    $("#toast").addClass("active");
    if(autoclose){
        console.log("triggering autoClose of toast...")
        setTimeout(() => {
            $("#toast").removeClass("active");
        }, 2000);
    }
}
$("#toast .delete").on("click", function(){
    $("#toast").removeClass("active");
})


// var stringToColour = function(str) {
//     var hash = 0;
//     for (var i = 0; i < str.length; i++) {
//       hash = str.charCodeAt(i) + ((hash << 5) - hash);
//     }
//     var colour = '#';
//     for (var i = 0; i < 3; i++) {
//       var value = (hash >> (i * 8)) & 0xFF;
//       colour += ('00' + value.toString(16)).substr(-2);
//     }
//     return colour;
//   }


  function hashCode(str) {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }
  
  function pickColor(str) {
    return `hsl(${hashCode(str) % 360}, 100%, 50%)`;
  }