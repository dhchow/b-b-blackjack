var BlackjackGame = Backbone.Model.extend({
  defaults: {
    inProgress: false
  },
  initialize: function(){
    this.people = new Backbone.Collection()
    
    this._initDeck()
    this._initDealer()
    this._initPlayer()
        
    this.player.on("change:standing", this.dealerTurn, this)    
  },
  deal: function(){
    log("deal()")
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
    log("stand()", person)
    person.set("standing", true)
    this.refreshState()
  },
  doubleDown: function(player){
    player.doubleDown()
    player.addCards(this.deck.draw())
    this.stand(player)
  },
  dealerTurn: function(){
    if (!this.get("inProgress")) return;
    
    log("dealerTurn(), hand value", this.dealer.get("hand").value())
    this.dealer.showHand()
    if (this.dealer.get("hand").value() < 17) {
      log("\tdealer hits")
      this.hit(this.dealer)
    } else {
      log("\tdealer stands")
      this.stand(this.dealer)
    }
  },
  _otherPerson: function(person){
    return this.people.without(person)[0]
  },
  refreshState: function(){
    log("refreshState(), inProgress ", this.get("inProgress"))
    if (!this.get("inProgress")) return;
    
    var winner, reason
    var allStanding = this.people.all(function(person){ return person.get("standing") })
    log("\tall standing?", allStanding)
    
    if ( allStanding ) {
      if (this.player.get("hand").value() == this.dealer.get("hand").value()) {
        winner = null
        reason = "Push"
      } else {
        winner = this.people.max(function(person){ return person.get("hand").value()})
        reason = winner.get("name") + " won with a higher hand"
      }
      log("\tWINNER!", winner)
    } else {
      this.people.each(function(person){
        log("\t" + person.get("name"), "hand value", person.get("hand").value())
        if (person.get("hand").value() > 21) {
          winner = this._otherPerson(person)
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
    
    if (winner) {
      this.endGame(winner, reason)
      if (allStanding) this.trigger("allStanding")
    } else if (!reason && this.player.get("standing")) {
      this.dealerTurn()
    } else if (!winner && reason == "Push") {
      log("\tpush")
      this.endGame(winner, reason)
      this.trigger("push")
      // Allow push notification to finish before re-dealing
      setTimeout(_.bind(function(){
        log("\tdeal (push)")
        this.deal()
      }, this), 2e3)
    }
  },
  reset: function(){
    this.set("inProgress", false)
    this.people.each(function(person){
      this.deck.discard(person.get("hand").models)
      person.get("hand").reset()
      person.set("standing", false, {silent: true})
      person.set("doubling", false)
    }, this)
  },
  endGame: function(winner, reason){    
    log("END GAME!")
    this.set("inProgress", false)
    this.dealer.showHand()
    if (winner) winner == this.player ? this.player.win() : this.player.lose()
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
    this.people.add(this.dealer)
  },
  _initPlayer: function(){
    this.player = new Player({name: "You"})
    this.set("player", this.player, {silent: true})
    this.people.add(this.player)
    this.loadCredit()
  }
})

var BlackjackView = Backbone.View.extend({
  model: BlackjackGame,
  initialize: function(){
    this.playerView = new PlayerView({el: this.$(".player"), model: this.model.get("player")})
    this.dealerView = new PersonView({el: this.$(".dealer"), model: this.model.get("dealer")})
    
    // Game events
    this.model
      .on("end:game", this.onGameEnd, this)
      .on("push", this.onPush, this)
      
    this.model.deck.on("shuffled", this.onShuffle, this)
  
    this.model.player.on("empty:credit", this.showPaypal, this)
                  
    $("[rel=tooltip]").tooltip()
    
    this.displayCredit()
  },
  alert: this.$(".alert"),
  events: {
    "click #double:not(.disabled)"    : "doubleDown",
    "click #hit:not(.disabled)"       : "hit",
    "click #stand:not(.disabled)"     : "stand",
    "click .bet:not(.disabled) .chip:not(.disabled)"  : "deal"
  },
  flipControls: function(){
    var front = this.$(".controls .btn-toolbar:visible")
    var back = this.$(".controls .btn-toolbar:not(:visible)")
    front.hide()
    back.removeClass("hide").show()
  },
  deal: function(){
    this.clearNotification()
    this.flipControls()
    
    if (this.model.player.get("credit") < this.model.player.get("bet") * 2)
      this.$("#double").addClass("disabled")
    else
      this.$("#double").removeClass("disabled")

    this.model.deal()
  },
  hit: function(){
    this.$("#double").addClass("disabled")
    this.model.hit(this.model.player)
  },
  stand: function(){
    this.model.stand(this.model.player)
  },
  doubleDown: function() {
    this.$("#double").addClass("active disabled")
    this.model.doubleDown(this.model.player)
  },
  displayCredit: function(){
    this.notify("none", "You have <strong>" + this.model.player.get("credit") + "</strong> chips", true)
    if (this.model.player.get("credit") == 0)
      this.showPaypal()
  },
  onGameEnd: function(info){
    var type = info.winner == this.model.player ? "success" : info.winner == null ? "info" : "danger"    
    this.notify(type, info.reason)
    this.$(".bet .chip").removeClass("active")
    this.flipControls()
  },
  onShuffle: function(){
    this.notify("info", "Deck reshuffled")
  },
  onPush: function(){
    this.flipControls()
  },
  clearNotification: function(){
    this.alert.hide()
  },
  notify: function(type, message, immediate){
    // Allow animations to finish
    setTimeout(_.bind(function(){
      this.alert
        .html(message)
        .removeClass("alert-success alert-error alert-info alert-danger alert-warning none")
        .addClass("alert-"+ type)
        .hide()
        
      this.alert.fadeIn("fast")      
    }, this), immediate ? 0 : 500)
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
  doubleDown: function() {
    this.set("bet", this.get("bet") * 2)
    this.set("doubling", true)
  },
  lose: function(){
    var credit = this.get("credit")
    var bet = this.get("bet")
    this.set({credit: credit - bet, bet: 0})
    this.trigger("changeStatus", {status: "lose", amount: bet})
  },
  win: function(){
    var credit = this.get("credit")
    var bet = this.get("bet")
    
    if (this.hasBlackjack())
      bet = Math.round(bet * 1.5)
      
    this.set({credit: credit + bet, bet: 0})
    this.trigger("changeStatus", {status: "win", amount: bet})
  }
})

var PlayerView = PersonView.extend({
  tagName: "div",
  model: Player,
  
  initialize: function(){
    PersonView.prototype.initialize.call(this)
    this.model
      .on("change:bet", this.onChangeBet, this)
      .on("change:credit", this.updateAffordability, this)
      .on("change:doubling", this.onChangeDouble, this)
      .on("changeStatus", this.animateBet, this)
      
    this.updateAffordability(this.model, this.model.get("credit"))
  },
  
  events: {
    "click .bet:not(.disabled) .chip:not(.disabled)" : "bet"
  },
    
  bet: function(ev){
    this.$(".bet .chip").removeClass("active")
    var target = $(ev.target).closest(".chip")
    target.addClass("active")
    this.model.set("bet", target.data("value"))
    
    this.addChipsToBet(target.data("value"))
  },
  
  addChipsToBet: function(value){
    var chips = this.generateChips(value)
    $(".chip-container .player-bet").append(chips)
  },
  
  generateChips: function(value) {
    return $(ich.chips({value: value}))
  },
  
  animateBet: function(data){
    if (data.status == "lose") {
      $(".player-bet .stack-o-chips").fadeOut(1e3, _.bind(function(){
        $(".player-bet .stack-o-chips").remove()
        this.trigger("end:animateBet")
      }, this))
    } else if (data.status == "win"){
      var newChips = this.generateChips(data.amount)
      $(".chip-container .dealer").append(newChips)
      newChips.animate({top: "+=190px"}, {
        duration: 1e3, 
        complete: _.bind(function(){
          setTimeout(_.bind(function() {
            $(".stack-o-chips:not(.total)").fadeOut(1e3, function(){ $(this).remove() })
            this.trigger("end:animateBet")
          }, this), 1e3)
        }, this)
      })
    }
  },
      
  onChangeBet: function(model, bet){
    if (!bet) this.$(".bet .chip").removeClass("active")
  },
  
  onChangeDouble: function(model, doubling){
    if (doubling) {
      var chips = this.generateChips(model.get("bet") / 2)
      $(".chip-container .player").prepend(chips)
    } else {
      this.$("#double").removeClass("active")
    }
  },
  
  updateAffordability: function(model, credit){
    $(".bet .chip").each(function(){
      credit < $(this).data("value") ? $(this).addClass("disabled") : $(this).removeClass("disabled")
    })
    $(".player-total span").text(credit)
  }
})

var log = function(){
  if (typeof debug != "undefined" && typeof console != "undefined") 
    console.log.apply(console, arguments)
}