require('express');
require('mongodb');
//load user model
const User = require("./models/user.js");
//load card model
const Card = require("./models/card.js");
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



    app.post('/api/login', async (req, res, next) =>
    {
        // incoming: login, password
        // outgoing: id, firstName, lastName, error
        var error = '';
       const { login, password } = req.body;
        // const db = client.db();
        // const results = await db.collection('Users').find({Login:login,Password:password}).toArray();
        const results = await User.find({ Login: login, Password: password });
    
        var id = -1;
        var fn = '';
        var ln = '';
        var ret;
        if( results.length > 0 )
        {
        id = results[0].UserId;
        fn = results[0].FirstName;
        ln = results[0].LastName;
        try
        {
        const token = require("./createJWT.js");
        ret = token.createToken( fn, ln, id );
        }
        catch(e)
        {
        ret = {error:e.message};
        }
        }
        else
        {
        ret = {error:"Login/Password incorrect"};
        }
        res.status(200).json(ret);
    });

    app.post('/api/register', async (req, res) => {
    const { userId, firstName, lastName, login, password } = req.body;

    try {
        // Check if login already exists
        const existing = await User.findOne({ Login: login });
        if (existing) {
        return res.status(400).json({ error: 'Login already exists' });
        }

        const newUser = new User({
        UserId: userId,
        FirstName: firstName,
        LastName: lastName,
        Login: login,
        Password: password  // NOT encrypted
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

