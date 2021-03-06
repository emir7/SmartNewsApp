const fs = require('fs');

module.exports.saveData = (req, res) => {

    const data = req.body.data;
    if (data != null) {
        fs.appendFile(`${__dirname}/data.csv`, data + "\n", (err) => {
            if (err) {
                console.log('there was an error');
                res.status(500).send({
                    m: 'NOK'
                });
                return;
            }
        });
        res.status(200).send({
            m: 'Ok'
        });
    } else {
        res.status(500).send({
            m: 'NOK'
        });
    }
};

module.exports.getData = (req, res) => {
  fs.readFile(`${__dirname}/data.csv`, 'utf8', function(err, contents) {
      res.status(200).send({
  		data: contents
  	});
  });
};