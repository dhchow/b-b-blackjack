
$(function(){
  window.blackjackGame = new BlackjackGame()
  window.blackjackView = new BlackjackView({model: blackjackGame, el: $(".container-fluid")})
  // window.testCard = new Card({suit: "hearts", rank: 5})
  // window.testCardView = new CardView({model: testCard}).render().el
  // window.testDeck = new Deck();
  // window.testHand = new Hand([{suit: "diams", rank: 7}, {suit: "diams", rank: 8}])
  // window.testHandView = new HandView({collection: testHand}).render().el  
  // window.testPlayer = new Player()
  // window.testPlayerView = new PlayerView({el: $(".player"), model: testPlayer})
})
var BlackjackGame = Backbone.Model.extend({
  defaults: {
    inProgress: false
  },
  initialize: function(){
    this._initDeck()
    this._initDealer()
    this._initPlayer()
  },
  deal: function(){
    this.set("inProgress", true)
    this.player.addCards(this.deck.draw(2))
    this.dealer.addCards(this.deck.draw(1))
  },
  _initDeck: function(){
    this.deck = new Deck()
    this.set("deck", this.deck)
    this._setCardValues()
    this.deck.shuffle()
  },
  _initDealer: function() {
    this.dealer = new Person()
    this.set("dealer", this.dealer)
  },
  _initPlayer: function(){
    this.player = new Player()
    this.set("player", this.player)
  },
  _setCardValues: function(){
    var aces = this.deck.findByRank("A")
    var tens = this.deck.findByRank(["J", "Q", "K"])
    _.each(aces, function(card){ card.set("value", 11) })
    _.each(tens, function(card){ card.set("value", 10) })
  }
})
var BlackjackView = Backbone.View.extend({
  model: BlackjackGame,
  initialize: function(){
    this.playerView = new PlayerView({el: this.$(".player"), model: this.model.get("player")})
    this.dealerView = new DealerView({el: this.$(".dealer"), model: this.model.get("dealer")})
    
    // Game events
    this.model.on("change:inProgress", this.onProgressChange, this)
    
    // Player events
    // this.model.player.on()
  },
  events: {
    "click #deal" : "deal"
  },
  deal: function(ev){
    if ($(ev.target).hasClass("disabled")) return;    
    this.model.deal()
  },
  onProgressChange: function(inProgress){
    if (inProgress) {
      this.$("#deal").addClass("disabled").removeClass("btn-primary")
      this.$(".bet").addClass("disabled")
    } else {
      this.$("#deal").removeClass("disabled").addClass("btn-primary")
      this.$(".bet").addClass("disabled")
    }
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
      rankView: rank == 10 ? "l0" : rank
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
  },
  shuffle: function(){
    var shuffled = Backbone.Collection.prototype.shuffle.call(this)
    this.models = shuffled
    return this
  }
})

var Person = Backbone.Model.extend({
  initialize: function(){
    this.set("hand", new Hand())
  },
  addCards: function(cards){
    if (!_.isArray(cards)) cards = [cards]
    
    _.each(cards, function(card){
      if (card instanceof Card) {
        this.get("hand").add(card)
      }      
    }, this)
  }
})

var PersonView = Backbone.View.extend({
  initialize: function(){
    this.handView = new HandView({el: this.$(".hand"), collection: this.model.get("hand")})
  }
})

// var Dealer = Person.extend({
// })

var DealerView = PersonView.extend({
  model: Person
})

var Player = Person.extend({
  defaults: {
    bet: 0,
    credit: 500
  },
  validate: function(attrs){
    if (attrs.bet > attrs.credit)
      return "Not enough credit :("
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

var PlayerView = PersonView.extend({
  tagName: "div",
  
  events: {
    "click .bet .btn" : "bet"
    // "click #hit"      : "hit"
    // "click #stand"    : "stand"
  },
    
  bet: function(ev){
    this.$(".bet .btn").removeClass("active")
    var target = $(ev.target)
    target.addClass("active")
    this.model.set("bet", target.data("value"))
  }
})
