require('express');
require('mongodb');
//load user model
const User = require("./models/user.js");
//load card model
const Card = require("./models/card.js");

//hashing stuff
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.setApp = function ( app, client )
{
    const token = require('./createJWT.js');



    app.post('/api/addcard', async (req, res, next) =>
    {
        // incoming: userId, color
        // outgoing: error
        const { userId, card, jwtToken } = req.body;
        try
        {
        if( token.isExpired(jwtToken))
        {
        var r = {error:'The JWT is no longer valid', jwtToken: ''};
        res.status(200).json(r);
        return;
        }
        }
        catch(e)
        {
        console.log(e.message);
        }
        const newCard = new Card({ Card: card, UserId: userId });
        var error = '';
        try
        {
            // const db = client.db();
            // const result = db.collection('Cards').insertOne(newCard);
            newCard.save();
        }
        catch (e)
        {
            error = e.toString();
        }
            var refreshedToken = null;
        try
        {
        refreshedToken = token.refresh(jwtToken);
        }
        catch(e)
        {
        console.log(e.message);
        }
        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });


    // incoming: email, password
    // outgoing: id, firstName, lastName, error
    app.post('/api/login', async (req, res, next) =>
    {

        var error = '';
        const { email, password } = req.body;
        const results = await User.find({email: email});

        //Checks if email was valid
        if( results.length === 0 )
        {   
            res.status(200).json({error:"Email/Password incorrect"});
            return;
        }

        //Checks if the password matches
        const isMatch = await bcrypt.compare(password, results[0].password);
        if (!isMatch) {
            res.status(200).json({ error: "Email/Password incorrect" });
            return;
        }

        var id = -1;
        var fn = '';
        var ln = '';
        var ret;
        
        id = results[0]._id;
        fn = results[0].firstName;
        ln = results[0].lastName;
        try
        {
            const token = require("./createJWT.js");
            ret = token.createToken( fn, ln, id );
        }
        catch(e)
        {
            ret = {error:e.message};
        }
        
        res.status(200).json(ret);
    });

    // incoming: firstName, lastName, email, password
    // outgoing: message, user, error
    app.post('/api/register', async (req, res) => {

        const { firstName, lastName, email, password } = req.body;

        try {
            if(!email || !password || !firstName || !lastName) {
                return res.status(400).json({ error: 'All fields are required' });
            }
            // Check if email already exists
            const existing = await User.findOne({ email: email });
            if (existing) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newUser = new User({
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: hashedPassword  //hashed password
            });

            await newUser.save();
            res.status(200).json({ message: 'User created successfully', user: newUser });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    
    app.post('/api/searchcards', async (req, res, next) =>{
        // incoming: userId, search
        // outgoing: results[], error
        var error = '';
        const { userId, search, jwtToken } = req.body;
        try
        {
        if( token.isExpired(jwtToken))
        {
        var r = {error:'The JWT is no longer valid', jwtToken: ''};
        res.status(200).json(r);
        return;
        }
        }
        catch(e)
        {
        console.log(e.message);
        }
        var _search = search.trim();
        const results = await Card.find({ "Card": { $regex: _search + '.*', $options: 'r' } });
        var _ret = [];
        for( var i=0; i<results.length; i++ )
        {
        _ret.push( results[i].Card );
        }
        var refreshedToken = null;
        try
        {
        refreshedToken = token.refresh(jwtToken);
        }
        catch(e)
        {
        console.log(e.message);
        }
        var ret = { results:_ret, error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });
}

