
$(function(){
  window.testCard = new Card({suit: "hearts", rank: 5})
  window.testCardView = new CardView({model: testCard}).render().el
  window.testDeck = new Deck();
  
  window.testHand = new Hand([{suit: "diams", rank: 7}, {suit: "diams", rank: 8}])
  console.log(testHand)
  window.testHandView = new HandView({collection: testHand}).render().el
  
  console.log(testHandView)

  $(".dealer").append(testHandView)
  // $(".dealer .row").append(testCardView)
  // console.log(testCard)
  // console.log(testCardView.el)
  // console.log(testDeck)
  // console.log(testCardView)
})

var BlackjackView = Backbone.View.extend({
  initialize: function(){
    this._initDeck()
    this._initPlayer()
    this.dealerHand = new Hand()
  },
  _initDeck: function(){
    this.deck = new Deck()
    this._setCardValues()
    this.deck.shuffle()
  },
  _initPlayer: function(){
    this.player = new Player()
    this.playerView = new PlayerView({ el: $(".player"), model: this.player})
  },
  _setCardValues: function(){
    var aces = this.deck.findByRank("A")
    var tens = this.deck.findByRank(["J", "Q", "K"])
    _.each(aces, function(card){ card.set("value", 11) })
    _.each(tens, function(card){ card.set("value", 10) })
  }
})

var Card = Backbone.Model.extend({
  initialize: function(){
    this.setId()
    this.setValue()
  },
  setId: function(){
    this.set("id", this.get("rank") + this.get("suit"))
  },
  setValue: function(){
    var rank = this.get("rank")
    var value = rank
    if (rank == "A") value = 1
    else if (rank == "J") value = 11
    else if (rank == "Q") value = 12
    else if (rank == "K") value = 13
    
    this.set("value", value)
  }
})
Card.SUITS = ["hearts", "spades", "clubs", "diams"]
Card.RANKS = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"]

var CardView = Backbone.View.extend({
  model: Card,
  tagName: 'div',
  attributes: function(){
    return { 
      "class"   : "card span2 " + this.model.get("suit"),
      "id" : this.model.get("suit") + this.model.get("rank"),  
    } 
  },
  render: function() {
    this.$el.html(ich.card(this.templateData()))
    return this;
  },
  templateData: function() {  
    var suit = this.model.get("suit")
    var rank = this.model.get("rank")
    return {
      suit: suit,
      suitView: "&"+ suit +";",
      // tweaking 10 to make it fit on the card better
      rankView: rank == 10 ? "&#953;o" : rank
    }
  }
})

var Hand = Backbone.Collection.extend({
  model: Card,
  value: function(){
    return this.reduce(function(memo, card){
      return memo + card.get("value")
    }, 0)
  }
})

var HandView = Backbone.View.extend({
  collection: Hand,
  tagName: "div",
  attributes: {"class": "hand row"},
  initialize: function(){
    this.collection
      .on("add", this.addOne, this)
      .on("remove", this.removeOne, this)
      .on("reset", this.removeAll, this)
  },
  render: function(){
    this.collection.each(function(card){
      this.addOne(card)
    }, this)
    return this
  },
  addOne: function(card){
    var elem = new CardView({model: card}).render().el
    this.$el.append(elem)
  },
  removeOne: function(card){
    this.$("#" + card.get("suit") + card.get("rank")).remove()
  },
  removeAll: function(){
    this.$el.empty()
  }
})

var Deck = Backbone.Collection.extend({
  model: Card,
  initialize: function(){    
    _.each(this.model.SUITS, function(s){
      _.each(this.model.RANKS, function(r){
        this.add({suit: s, rank: r})
      }, this)
    }, this)
  },
  draw: function(number){
    var drawn = []
    number = number || 1
    // .pop() is still making its way into backbone RC
    while(number-- && this.length) {
      var first = this.first()
      this.remove(first)
      drawn.push(first)
    }
    return drawn
  },
  findByRank: function(ranks){
    var ranks = _.isArray(ranks) ? ranks : [ranks]
    return this.filter(function(card){ return _.indexOf(ranks, card.get("rank")) != -1})
  }
})

var Player = Backbone.Model.extend({
  defaults: {
    bet: 0,
    hand: new Hand(),
    credit: 500
  },
  validate: function(attrs){
    if (attrs.bet > attrs.credit)
      return "Not enough credit :("
  },
  addCard: function(card){
    if (card instanceof Card)
      this.get("hand").add(card)
  },
  lose: function(){
    var credit = this.get("credit")
    var bet = this.get("bet")
    this.set({credit: credit - bet, bet: 0})
  },
  win: function(){
    var credit = this.get("credit")
    var bet = this.get("bet")
    this.set({credit: credit + bet, bet: 0})
  }
})

var PlayerView = Backbone.View.extend({
  tagName: "div",
    
  events: {
    "click .bet .btn" : "bet"
    // "click #deal"     : "deal"
    // "click #hit"      : "hit"
    // "click #stand"    : "stand"
  },
  
  // deal: function(){
  //   
  // },
  
  bet: function(ev){
    this.$(".bet .btn").removeClass("active")
    var target = $(ev.target)
    target.addClass("active")
    this.model.set("bet", target.data("value"))
  }
})
