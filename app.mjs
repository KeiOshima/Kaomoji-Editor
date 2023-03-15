import express from 'express';
import session from 'express-session';
import url from 'url';
import path from 'path';
import {Kaomoji} from './kaomoji.mjs';
import fs from 'fs';




const app = express();
const KaomojiData = [];
app.set('view engine', 'hbs');
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 
const publicPaths = path.resolve(__dirname, "public");


fs.readFile('code-samples/kaomojiData.json', (err, data) =>{
    if(err){
        console.log("whoops something went wrong");
        throw err;
    }


    const parsedData = JSON.parse(data);
    for(const ToAdd of parsedData){
        const KaomojiToAdd = new Kaomoji(ToAdd.value, ToAdd.emotions);
        KaomojiData.push(KaomojiToAdd);
    }
    app.listen(3000);
    console.log("Server started; type CTRL+C to shut down");
});


const sessionOptions = {
	secret: 'a secret',
	resave: true,
	saveUninitialized: true
};
app.use(session(sessionOptions));

app.use(express.urlencoded({extended: true}));



app.use((req,res,next)=>{
    const GetMethod = req.method;
    const GetPath = req.path;
    const getQuery= JSON.stringify(req.query);

    console.log("Method: " + GetMethod);
    console.log("Path: " + GetPath);
    console.log("Query: " + getQuery);
    next();
});



app.use(express.static(publicPaths));


app.get('/', (req, res) =>{
    res.redirect('/editor');
});

app.get('/editor', (req, res) =>{
    res.render('editor');
});

app.get('/dictionary', (req, res) =>{
    const emotion = req.query.emotion;
    let SearchedKaomoji = KaomojiData;

    // check if we have a claue in the search bar if we do then we filter to see if that input matchs any emotion that we have. 
    if (emotion !== undefined) {
        SearchedKaomoji = KaomojiData.filter((element) => element.isEmotion(emotion));
    }
    res.render('dictionary', {KaomojiData: SearchedKaomoji});

});

app.post('/dictionary', (req, res)=>{
    const AddData = req.body;
    const ValueToAdd = AddData.value;
    const EmotionToAdd = AddData.emotions;
    // using a regex expression to split the sring by spaces or ,
    // regex obtained from https://stackoverflow.com/questions/10346722/how-to-split-a-string-by-white-space-or-comma?rq=1
    const EmotionToAddSplit = EmotionToAdd.split(/[ ,]+/);
    const NewKaomoji = new Kaomoji(ValueToAdd, EmotionToAddSplit);
    KaomojiData.push(NewKaomoji);
    // check if a count object exsist yet when we add an kaomoji
    // if it does we increaase the counter we have
    // if it doesnt then we crate one adn set its value to one. 
    if (req.session.count) {
        req.session.count += 1;
    } else {
        req.session.count = 1;
    }
    res.redirect('/dictionary');
});

// helper function to chech if the word we are currently at corresoponds to a kaomoji.
function CheckKaomoji(word){
    let numChange = 1;
    let returnVal = "";
    for(let y = 0; y < KaomojiData.length; y++){
        if(KaomojiData[y].isEmotion(word) === true){ 
           returnVal += KaomojiData[y].value;
           numChange = 0;
        }         
    }
    return [numChange, returnVal];
}

// helper function that build new string that has certain words replaced with kaomoji. 
function ReplaceWithKaomoji(inputText){
    // regex obtained from https://stackoverflow.com/questions/10346722/how-to-split-a-string-by-white-space-or-comma?rq=1 
    const StringInput = inputText.split(/[ ,]+/);
    let StringToReturn = "";
    for(let x = 0; x < StringInput.length; x++){
        const WordToCheck = StringInput[x];
        const StringToAdd = CheckKaomoji(WordToCheck);
        if(StringToAdd[0] === 0){
            StringToReturn += StringToAdd[1];
        }
        else{
            StringToReturn += WordToCheck;
        }
        StringToReturn += " ";
    }

    return StringToReturn;
    
}


app.post('/editor', (req, res) =>{
    const GetData = req.body;
    const TextToCheck = GetData['input'];
    const TextToReturn = ReplaceWithKaomoji(TextToCheck);
    res.render('editor', {OutPut: TextToReturn});
});

app.get('/stats', (req, res) =>{
    res.render('stats', {TotalCount: req.session.count || 0 });
});



