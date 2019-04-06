var express = require("express");
var router = express.Router();
var db = require("../db");
var sql = require('../sql/index');

router.get("/", function (req, res, next) {
  res.send("<h1>No product listing code provided!</h1>");
});

router.get("/:productId", async (req, res, next) => {
  let itemid = req.params.productId;
  let userid = req.user.id;

  // SQL Query Parallel Execution
  try {
    let promises = [
      db.db_promise(sql.sql_getProductInfo, [itemid]),
      db.db_promise(sql.sql_getProductImg, [itemid]),
      db.db_promise(sql.sql_getSellerReview, [itemid]),
      db.db_promise(sql.sql_getYouMayAlsoLike),
      db.db_promise(sql.sql_getCurrentBid,[itemid,userid])
    ]

    let results = await Promise.all(promises)
    let options = { year: 'numeric', month: 'long', day: 'numeric' }
    if (results[0][0].accountid == userid) {
      return res.redirect("../op/" + itemid)
    }

    // Render page once all data is collected 
    res.render("product", {
      title: "productlisting",
      data: results[0][0],
      imgs: results[1],
      revs: results[2],
      recs: results[3],
      bid: results[4][0].amount,
      productId: itemid,
      user: req.user,
      options: options 
    });
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }

  if (req.isAuthenticated()) {
    userid = req.user.id;
    db.query(sql.sql_insertview, [itemid, userid], (err, data) => {
      if (err) {
        console.log("SQL error inserting view " + err);
      }
    });
  }
});

router.post("/:productId/makebid", async function (req, res, next) {

  if (!req.isAuthenticated()) {
    return res.sendStatus(403);
  }

  let itemid = req.params.productId;
  let bidPrice = req.body.bidPrice;
  let buyerId = req.user.id;
  try {
    let rid = await db.db_promise(sql.sql_insertBid, [buyerId, bidPrice, itemid])
  } catch (err) {
    return res.sendStatus(500);
  }
  return res.sendStatus(200);
})



router.post("/:productId/review", async function (req, res, next) {
  /*--------------------- SQL Query Statement -------------------*/
  res.sendStatus(404);
  /* ---------------------------------------------------------- */

})

module.exports = router;
