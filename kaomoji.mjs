export class Kaomoji{
    constructor(value, emotions){
        this.value = value;
        this.emotions = emotions;
    }

    isEmotion(element){
        return this.emotions.includes(element.toLowerCase());
    }
}



