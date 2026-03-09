$(document).ready(function(){

$("#book").turn({

width:900,

height:600,

autoCenter:true,

gradients:true,

acceleration:true,

display:'double',

when:{
turning:function(event,page,view){
console.log("Page turning",page);
}
}

});

});