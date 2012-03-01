$(function(){
  window.blackjackGame = new BlackjackGame()
  window.blackjackView = new BlackjackView({model: blackjackGame, el: $(".container-fluid")})
})

var BlackjackGame = Backbone.Model.extend({
  defaults: {
    inProgress: false
  },
  initialize: function(){
    this.people = []
    
    this._initDeck()
    this._initDealer()
    this._initPlayer()
        
    this.on("change:turn", this.onChangeTurn, this)
  },
  deal: function(){
    console.log("DEEEEEAL")
    this.reset()
    this.player.addCards(this.deck.draw(2))
    this.dealer.addCards(this.deck.draw())
    this.set("inProgress", true)
    this.set("turn", this.dealer, {silent: true})
    this.refreshState()
  },
  hit: function(person){
    person.addCards(this.deck.draw())
    this.endTurn()
  },
  stand: function(person){
    person.set("standing", true, {silent: true})
    this.endTurn()
  },
  endTurn: function(){
    this.trigger("end:turn")
    this.refreshState()
  },
  nextTurn: function(){
    if (!this.get("inProgress")) return;
    
    var currentPersonIndex = this.people.indexOf(this.get("turn"))
    // This ensures that Backbone will trigger the change event every time
    this.unset("turn")
    if (currentPersonIndex == this.people.length-1) {
      this.set("turn", this.people[0])
    } else {
      this.set("turn", this.people[currentPersonIndex+1])
    }
  },
  onChangeTurn: function(){
    if (this.get("turn")) {
      console.log("->", this.get("turn").get("name"), this.get("turn").get("standing"))
      if (this.get("turn").get("standing")) {
        this.endTurn()
      } else if (this.get("turn") == this.dealer){
        this.dealerTurn()
      }
    }
  },
  dealerTurn: function(){
    console.log("dealer turn! hand value", this.getHandValue(this.dealer))
    if (this.getHandValue(this.dealer) < 17) {
      console.log("dealer hits")
      this.hit(this.dealer)
    } else {
      console.log("dealer stands")
      this.stand(this.dealer)
    }
  },
  getHandValue: function(person){
    var handValue = person.get("hand").value()
    if (handValue > 21 && person.get("hand").hasRank("A")) {
      var aces = person.get("hand").filter(function(card){ return card.get("rank") == "A"})
      return handValue - (10 * aces.length);
    } else {
      return handValue
    }
  },
  hasBlackjack: function(person){
    return person.get("hand").length == 2 && this.getHandValue(person) == 21
  },
  _otherPerson: function(person){
    var other = _.without(this.people, person)
    return other.length ? other[0] : null
  },
  refreshState: function(){
    var winner, reason
    var allStanding = _.all(this.people, function(person){ return person.get("standing") })
    console.log("\tall standing?", allStanding)
    
    if ( allStanding ) {
      if (this.player.get("hand").value() == this.dealer.get("hand").value()) {
        winner = null
        reason = "Push"
      } else {
        winner = _.max(this.people, function(person){ return this.getHandValue(person)}, this)
        reason = winner.get("name") + " won with a higher hand"
      }
      console.log("WINNER!", winner)
    } else {
      _.each(this.people, function(person){
        console.log("\t" + person.get("name"), "hand value", this.getHandValue(person))
        if (this.getHandValue(person) > 21) {
          winner = person == this.dealer ? this.player : this.dealer
          reason = person.get("name") + " busted!"
        } else if (this.getHandValue(person) == 21) {
          var otherPerson = this._otherPerson(person)
          if (this.getHandValue(otherPerson) == 21) {
            if (this.hasBlackjack(person)) {
              if (this.hasBlackjack(otherPerson)) {
                winner = null
                reason = "Push"              
              } else {
                winner = person
                reason = person.get("name") + " got a blackjack!"
              }
            }
          } else {
            winner = person
            reason = person.get("name") + " got " + (this.hasBlackjack(person) ? "a blackjack!" : "21!")
          }
        }
      }, this)
    }
    
    if (winner || reason) {
      this.endGame(winner, reason)
    } else {
      console.log("nextTurn()")
      this.nextTurn()
    }
  },
  reset: function(){
    _.each(this.people, function(person){
      this.deck.discard(person.get("hand").models)
      person.get("hand").reset()
      person.set("standing", false, {silent: true})
    }, this)
    this.set("inProgress", false, {silent: true})
  },
  endGame: function(winner, reason){
    this.set("inProgress", false)
    winner == this.player ? this.player.win() : this.player.lose()
    this.trigger("end:game", {
      winner: winner,
      reason: reason
    })  
  },
  _initDeck: function(){
    this.deck = new Deck()
    this.set("deck", this.deck, {silent: true})
    this.deck.shuffle()
  },
  _initDealer: function() {
    this.dealer = new Person({name: "Dealer"})
    this.set("dealer", this.dealer, {silent: true})
    this.people.push(this.dealer)
  },
  _initPlayer: function(){
    this.player = new Player({name: "You"})
    this.set("player", this.player, {silent: true})
    this.people.push(this.player)
  }
})
var BlackjackView = Backbone.View.extend({
  model: BlackjackGame,
  initialize: function(){
    this.playerView = new PlayerView({el: this.$(".player"), model: this.model.get("player")})
    this.dealerView = new DealerView({el: this.$(".dealer"), model: this.model.get("dealer")})
    
    // Game events
    this.model
      .on("change:inProgress", this.onProgressChange, this)
      .on("end:game", this.onGameEnd, this)
      
    this.model.player.on("change:bet", this.onBet, this)
    
    this.model.deck.on("shuffled", this.onShuffle, this)
      
    this.$("#deal,#hit,#stand").addClass("disabled")
  },
  events: {
    "click #deal:not(.disabled)"   : "deal",
    "click #hit:not(.disabled)"    : "hit",
    "click #stand:not(.disabled)"  : "stand"
  },
  deal: function(ev){
    this.$("#hit,#stand").removeClass("disabled")
    this.model.deal()
  },
  hit: function(ev){
    this.model.hit(this.model.player)
  },
  stand: function(ev){
    $("#hit").addClass("disabled")
    this.model.stand(this.model.player)
  },
  onBet: function(){
    this.$("#deal,#hit,#stand").removeClass("disabled")
  },
  onProgressChange: function(){
    console.log("inprogress", this.model.get("inProgress"))
    if (this.model.get("inProgress")) {
      this.$("#deal").addClass("disabled").removeClass("btn-primary")
      this.$(".bet").addClass("disabled")
      this.$(".alert").text("").addClass("none")
    } else {
      this.$("#deal").removeClass("disabled").addClass("btn-primary")
      this.$("#hit,#stand").addClass("disabled")
      this.$(".bet").addClass("disabled")
    }
  },
  onGameEnd: function(info){
    var type = info.winner == this.model.player ? "success" : info.winner == null ? "warning" : "danger"    
    this.notify(type, info.reason)
    this.$("#deal,#hit,#stand").addClass("disabled")
  },
  onShuffle: function(){
    this.notify("info", "Deck reshuffled")
  },
  notify: function(type, message){
    this.$(".alert")
      .text(message)
      .removeClass("alert-success alert-error alert-info alert-danger alert-warning none")
      .addClass("alert-"+type)
      .show()
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
    if (rank == "A") value = 11
    else if (rank == "J" || rank == "Q" || rank == "K") value = 10
    
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
  },
  hasRank: function(rank){
    return this.any(function(card){ return card.get("rank") == rank })
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
    this._discard = []
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
    while(number--) {
      if (!this.length) {
        this.add(this._discard)
        this.shuffle()
        this._discard = []
      }
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
    this.trigger("shuffled")
    return this
  },
  discard: function(cards){
    this._discard = this._discard.concat(cards)
  }
})

var Person = Backbone.Model.extend({
  initialize: function(){
    this.set("hand", new Hand())
    this.get("hand")
      .on("add", this.onHandChange, this)
      .on("remove", this.onHandChange, this)
  },
  addCards: function(cards){
    if (!_.isArray(cards)) cards = [cards]
    
    _.each(cards, function(card){
      if (card instanceof Card) {
        this.get("hand").add(card)
      }      
    }, this)
  },
  onHandChange: function(){
    this.trigger("change:hand")
  }
})

var PersonView = Backbone.View.extend({
  initialize: function(){
    this.handView = new HandView({el: this.$(".hand"), collection: this.model.get("hand")})
  }
})

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
  model: Player,
  
  initialize: function(){
    PersonView.prototype.initialize.call(this)
    this.model
      .on("change:credit", this.updateCredit, this)
      .on("change:bet", this.updateBet, this)
  },
  
  events: {
    "click .bet .btn" : "bet"
  },
    
  bet: function(ev){
    this.$(".bet .btn").removeClass("active")
    var target = $(ev.target)
    target.addClass("active")
    this.model.set("bet", target.data("value"))
  },
  
  updateCredit: function(model, credit){
    this.$(".total").text(credit)
  },
  
  updateBet: function(model, bet){
    console.log("update bet")
    if (!bet) {
      this.$(".bet .btn").removeClass("active")
    }
  }
})
