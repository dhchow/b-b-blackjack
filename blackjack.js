var BlackjackGame = Backbone.Model.extend({
  defaults: {
    inProgress: false
  },
  initialize: function(){
    this.people = []
    
    this._initDeck()
    this._initDealer()
    this._initPlayer()
        
    this.player.on("change:standing", this.dealerTurn, this)
  },
  deal: function(){
    console.log("deal")
    this.reset()
    this.player.addCards(this.deck.draw(2))
    var dealers = this.deck.draw(2)
    dealers[1].flip()
    this.dealer.addCards(dealers)
    this.set("inProgress", true)
    this.refreshState()
  },
  hit: function(person){
    person.addCards(this.deck.draw())
    this.refreshState()
  },
  stand: function(person){
    person.set("standing", true)
    this.refreshState()
  },
  dealerTurn: function(){
    console.log("dealer turn! hand value", this.dealer.get("hand").value())
    this.dealer.showHand()
    if (this.dealer.get("hand").value() < 17) {
      console.log("dealer hits")
      this.hit(this.dealer)
    } else {
      console.log("dealer stands")
      this.stand(this.dealer)
    }
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
        winner = _.max(this.people, function(person){ return person.get("hand").value()}, this)
        reason = winner.get("name") + " won with a higher hand"
      }
      console.log("WINNER!", winner)
    } else {
      _.each(this.people, function(person){
        console.log("\t" + person.get("name"), "hand value", person.get("hand").value())
        if (person.get("hand").value() > 21) {
          winner = person == this.dealer ? this.player : this.dealer
          reason = person.get("name") + " busted!"
        } else if (person.get("hand").value() == 21) {
          var otherPerson = this._otherPerson(person)
          if (otherPerson.get("hand").value() == 21) {
            if (person.hasBlackjack()) {
              if (otherPerson.hasBlackjack()) {
                winner = null
                reason = "Push"              
              } else {
                winner = person
                reason = person.get("name") + " got a blackjack!"
              }
            }
          } else {
            winner = person
            reason = person.get("name") + " got " + (person.hasBlackjack() ? "a blackjack!" : "21!")
          }
        }
      }, this)
    }
    
    if (winner || reason) {
      this.endGame(winner, reason)
      if (allStanding) this.trigger("allStanding")
    } else if (this.player.get("standing")) {
      this.dealerTurn()
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
    this.saveCredit()
  },
  saveCredit: function(value){
    if (localStorage) {
      localStorage.setItem("blackjackCredit", value || this.player.get("credit"))
    }
  },
  loadCredit: function(){
    if (localStorage && localStorage.getItem("blackjackCredit")) {
      this.player.set("credit", parseInt(localStorage.getItem("blackjackCredit")))
    }
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
    this.loadCredit()
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
      .on("allStanding", this.notify, this)
      
    this.model.deck.on("shuffled", this.onShuffle, this)
    
    this.model.player.on("empty:credit", this.showPaypal, this)
    
    this.playerView.handView.on("end:animate", this.notify, this)
    this.dealerView.handView.on("end:animate", this.notify, this)
          
    this.$("#deal,#hit,#stand").addClass("disabled")
    
    this.displayCredit()
  },
  alert: this.$(".alert"),
  events: {
    "click #deal:not(.disabled)"      : "deal",
    "click #hit:not(.disabled)"       : "hit",
    "click #stand:not(.disabled)"     : "stand",
    "click .bet:not(.disabled) .btn:not(.disabled)"  : "deal",
    "mouseover .bet"                  : "displayCredit"
  },
  deal: function(){
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
  displayCredit: function(){
    this.notify("none", "You have " + this.model.player.get("credit") + " chips")
  },
  onProgressChange: function(){
    console.log("inprogress", this.model.get("inProgress"))
    if (this.model.get("inProgress")) {
      this.$("#deal").addClass("disabled").removeClass("btn-primary")
      this.$(".bet").addClass("disabled")
    } else {
      this.$("#deal").removeClass("disabled").addClass("btn-primary")
      this.$("#hit,#stand").addClass("disabled")
      this.$(".bet").removeClass("disabled")
    }
  },
  onGameEnd: function(info){
    var type = info.winner == this.model.player ? "success" : info.winner == null ? "info" : "danger"    
    this.queueNotification(type, info.reason)
    this.$("#deal,#hit,#stand").addClass("disabled")
  },
  onShuffle: function(){
    this.queueNotification("info", "Deck reshuffled")
  },
  queueNotification: function(type, message){
    this.notification = {type: type, message: message}
  },
  // Uses notification queue if no args are passed in
  notify: function(type, message){
    if (!arguments.length && this.notification) {
      type = this.notification.type
      message = this.notification.message
      this.notification = null
    }
    if ( type && message ) {
      var fade = !this.alert.hasClass("alert-"+type)
      
      this.alert
        .text(message)
        .removeClass("alert-success alert-error alert-info alert-danger alert-warning none")
        .addClass("alert-"+type)
        .hide()
        
      fade ? this.alert.fadeIn("fast") : this.alert.show()
      
      if (type != "none") {
        setTimeout(_.bind(function(){ 
          this.displayCredit()
        }, this), 4e3)
      }
    }
  },
  showPaypal: function(){
    $("#paypal form").submit(_.bind(function(){
      var selected = $("#paypal select").val().replace(/\D/g, "")
      this.model.saveCredit(this.model.player.get("credit") + parseInt(selected))
    }, this))
    setTimeout(function(){
      $("#paypal").modal()
    }, 2e3)
  }
})

var Card = Backbone.Model.extend({
  defaults: {
    faceUp: true
  },
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
  },
  flip: function(){
    this.set("faceUp", !this.get("faceUp"))
  }
})
Card.SUITS = ["hearts", "spades", "clubs", "diams"]
Card.RANKS = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"]

var CardView = Backbone.View.extend({
  model: Card,
  tagName: 'div',
  attributes: function(){
    var back = this.model.get("faceUp") ? "" : "back"
    var classes = ["card", "span2", this.model.get("suit"), back]
    return { 
      "class"   : classes.join(" "),
      "id" : this.model.get("suit") + this.model.get("rank"),  
    } 
  },
  initialize: function(){
    this.model.on("change:faceUp", this.flip, this)
  },
  flip: function(model, faceUp){
    this.$el.toggleClass("back")
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
    var value = this.reduce(function(memo, card){
      return memo + card.get("value")
    }, 0)
    if (value > 21 && this.hasRank("A")) {
      var aces = this.filter(function(card){ return card.get("rank") == "A"})
      value -= (10 * aces.length)
    }
    return value
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
    setTimeout(_.bind(function(){
      this.$el.append(elem)
      $(elem).animate({top: "+=100px"}, {
        duration: "fast", 
        complete: _.bind(function(){
          HandView.animate--      
          if (!HandView.animate)
            this.trigger("end:animate")        
        }, this)
      });   
    }, this), 500 * HandView.animate++)
  },
  removeOne: function(card){
    this.$("#" + card.get("suit") + card.get("rank")).remove()
  },
  removeAll: function(){
    this.$el.empty()
  }
})
HandView.animate = 0

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
  hasBlackjack: function(){
    return this.get("hand").length == 2 && this.get("hand").value() == 21
  },
  showHand: function(){
    this.get("hand").each(function(card){
      card.set("faceUp", true)
    })
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
    if (!attrs.credit)
      this.trigger("empty:credit")
  },
  lose: function(){
    var credit = this.get("credit")
    var bet = this.get("bet")
    this.set({credit: credit - bet, bet: 0})
    this.trigger("changeStatus", "lose")
  },
  win: function(){
    var credit = this.get("credit")
    var bet = this.get("bet")
    
    if (this.hasBlackjack())
      bet = bet * 1.5
      
    this.set({credit: credit + bet, bet: 0})
    this.trigger("changeStatus", "win")
  }
})

var PlayerView = PersonView.extend({
  tagName: "div",
  model: Player,
  
  initialize: function(){
    PersonView.prototype.initialize.call(this)
    this.model
      .on("change:bet", this.enableBet, this)
      .on("change:credit", this.updateAffordability, this)
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
    
  enableBet: function(model, bet){
    if (!bet) this.$(".bet .btn").removeClass("active")
  },
  
  updateAffordability: function(model, credit){
    $("#bet1, #bet5, #bet25, #bet100").each(function(){
      credit < $(this).data("value") ? $(this).addClass("disabled") : $(this).removeClass("disabled")
    })
  }
})