function timeDifference(dateTimeString){
    const now = new Date();
    const past = new Date(dateTimeString); 

    let timediff = Math.floor((now - past) / 1000);

    const days = Math.floor(timediff / (60 * 60 * 24));

    timediff = timediff - days * 24 * 60 * 60;

    const hours = Math.floor(timediff/(60*60));

    timediff = timediff - hours * 60 * 60;

    const minutes = Math.floor(timediff / 60);
    
    const seconds = timediff - minutes * 60;

    let result = "";

    // string concatenation
    if(days > 0){
        result = result + `${days} days `;
    }
    else if(hours > 0){
        result = result + `${hours} hours `;
    }
    else if(minutes > 0){
        result = result + `${minutes} minutes `;
    }
    else if(seconds > 0){
        result = result + `${seconds} seconds `;
    }
    
    return result;
}

timeDifference();