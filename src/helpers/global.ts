export const convertTo24Hour = (time:string) =>{

    let hours = parseInt(time.substr(0, 2));
    if(time.indexOf('AM') != -1 && hours == 12) {
        time = time.replace('12', '0');
    }
    if(time.indexOf('PM')  != -1 && hours < 12) {
        time = time.replace(hours.toString(), (hours + 12).toString());
    }
    return time.replace(/(AM|PM)/, '');
}