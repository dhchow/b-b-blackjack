$(function(){
  window.testCard = new Card({suit: "hearts", rank: 5})
  window.testCardView = new CardView(testCard)
  window.testDeck = new Deck();

  $("#dealer").append()
  console.log(testCard)
  console.log(testDeck)
  console.log(testCardView)
})

var Card = Backbone.Model.extend({
})
Card.SUITS = ["hearts", "spades", "clubs", "diams"]
Card.RANKS = ["ace", 2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king"]

var CardView = Backbone.View.extend({
  tagName: 'li',
  render: function() {
    this.el = ich.card(this.templateData())
    return this;
  },
  templateData: function() {    
    return {
      suit: suit,
      suitView: "&"+suit+";",
      // tweaking 10 to make it fit on the card better
      rankView: this.model.rank == 10 ? "&#953;o" : this.model.rank
    }
  }
})

var CardsView = Backbone.View.extend({
  tagName: 'ul'
})

var Deck = Backbone.Collection.extend({
  model: Card,
  initialize: function(){    
    _.each(this.model.SUITS, function(s){
      _.each(this.model.RANKS, function(r){
        this.add({suit: s, rank: r})
      }.bind(this))
    }.bind(this))
  },
  draw: function(number){
    var drawn = []
    number = number || 1
    while(number--) {
      var first = this.first()
      drawn.push(first)
      this.remove(first)
    }
    return drawn
  }
})

var Player = Backbone.Model.extend({
  
})

