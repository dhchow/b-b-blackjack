$(function(){
  window.testCard = new Card({suit: "hearts", rank: 5})
  window.testCardView = new CardView({model: testCard}).render()
  window.testDeck = new Deck();

  $(".dealer .row").append($(testCardView.el))
  console.log(testCard)
  console.log(testCardView.el)
  console.log(testDeck)
  console.log(testCardView)
})

var BlackjackView = Backbone.View.extend({
  
})

var Card = Backbone.Model.extend({
})
Card.SUITS = ["hearts", "spades", "clubs", "diams"]
Card.RANKS = ["ace", 2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king"]

var CardView = Backbone.View.extend({
  model: Card,
  tagName: 'div',
  attributes: function(){
    return { "class": "card span2 " + this.model.get("suit") } 
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

var CardsView = Backbone.View.extend({
  tagName: 'div'
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
    // Amazingly, no pop in backbone or underscore?
    while(number-- && this.length) {
      var first = this.first()
      drawn.push(first)
      this.remove(first)
    }
    return drawn
  }
})

var Player = Backbone.Model.extend({
  defaults: {
    bet: 0,
    cards: [],
    credit: 500
  },
  validate: function(attrs){
    if (attrs.bet > attrs.credit)
      return "Not enough credit :("
  },
  addCard: function(card){
    if (card instanceof Card)
      this.get("cards").push(card)
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
