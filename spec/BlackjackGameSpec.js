describe("BlackjackGame", function(){
  var game
  
  beforeEach(function() {
    game = new BlackjackGame()
    // The listener normally resets the game if anyone busts
    game.off("end:game")
  })
  
  it("has a new shuffled deck of cards", function(){
    spyOn(Deck.prototype, "shuffle")
    // New game since we need to spy before creation
    game = new BlackjackGame()
    expect(game.deck).toBeDefined()
    expect(game.deck.shuffle).toHaveBeenCalled()
  })
  
  it("overrides non-number cards with proper blackjack values", function() {
    var aces = game.deck.findByRank("A")
    var tens = game.deck.findByRank(["J","Q","K"])
    
    var badAcesExist = _.any(aces, function(card){ return card.get("value") != 11 })
    var badTensExist = _.any(tens, function(card){ return card.get("value") != 10 })
    
    expect(badAcesExist).toBe(false)
    expect(badTensExist).toBe(false)
  })
  
  it("creates a player and adds it to people", function() {
    expect(game.player).toBeDefined()
    expect(game.people.length).toBeGreaterThan(0)
  })

  it("creates a dealer and adds it to people", function() {
    expect(game.dealer).toBeDefined()
    expect(game.people.length).toBeGreaterThan(0)
  })
  
  it("no one is assigned a turn", function() {
    expect(game.get("turn")).not.toBeDefined()
  })
      
  it("calls #nextTurn when person ends their turn", function(){
    spyOn(BlackjackGame.prototype, "nextTurn")
    var diffGame = new BlackjackGame
    diffGame.endTurn()
    expect(diffGame.nextTurn).toHaveBeenCalled()
  })
  
  describe("#deal", function(){
    beforeEach(function() {
      spyOn(game.deck, "draw").andCallThrough()
      spyOn(game.player, "addCards").andCallThrough()      
      spyOn(game.dealer, "addCards").andCallThrough()
    })
    
    it("marks game as in progress", function(){
      expect(game.get("inProgress")).toBe(false)
      game.deal()
      expect(game.get("inProgress")).toBe(true)
    })
    
    it("gives player two cards from the deck", function() {
      expect(game.player.get("hand").length).toBe(0)
      game.deal()
      expect(game.deck.draw).toHaveBeenCalled()
      expect(game.player.addCards).toHaveBeenCalled()
      expect(game.deck.length).toBeLessThan(52)
      expect(game.player.get("hand").length).toBe(2)
    })
    
    it("gives dealer one card from the deck", function(){
      expect(game.dealer.get("hand").length).toBe(0)
      game.deal()
      expect(game.deck.draw).toHaveBeenCalled()
      expect(game.dealer.addCards).toHaveBeenCalled()
      expect(game.deck.length).toBe(49)
      expect(game.dealer.get("hand").length).toBe(1)
    })
    
    it("assigns turn to player", function() {
      game.deal()
      expect(game.get("turn")).toBe(game.player)
    })
    
    describe("when players still have cards in hand", function() {
      it("resets the game", function() {
        spyOn(game, "reset").andCallThrough()
        game.player.addCards(game.deck.draw())
        game.dealer.addCards(game.deck.draw())
        game.deal()
        expect(game.reset).toHaveBeenCalled()
      })
    })
  })  
  
  describe("#refreshState", function(){
    describe("when player's hand is over 21", function() {
      it("triggers end:game event", function() {
        spyOn(game.player.get("hand"), "value").andReturn(22)
        var endCallback = jasmine.createSpy()
        game.on("end:game", endCallback)
        game.refreshState.call(game)
        expect(endCallback).toHaveBeenCalled()
      })
    })
    describe("when dealer's hand is over 21", function() {
      it("triggers end:game event", function() {
        spyOn(game.dealer.get("hand"), "value").andReturn(22)
        var endCallback = jasmine.createSpy()
        game.on("end:game", endCallback)
        game.refreshState.call(game)
        expect(endCallback).toHaveBeenCalled()     
      })
    })
    describe("when dealer and player are both standing", function() {
      it("triggers end:game event", function() {
        game.dealer.set("standing", true)
        game.player.set("standing", true)
        var endCallback = jasmine.createSpy()
        game.on("end:game", endCallback)
        game.refreshState.call(game)
        expect(endCallback).toHaveBeenCalled()  
      })
    })
  })
  
  describe("#nextTurn", function() {
    it("sets turn to next person", function() {
      var person1 = new Person()
      var person2 = new Person()
      game.set("inProgress", true)
      game.people = [person1, person2]
      game.set("turn", person1)
      game.nextTurn()
      expect(game.get("turn")).toBe(person2)
      game.nextTurn()
      expect(game.get("turn")).toBe(person1)
    })    
    
    describe("when next turn is dealer's", function() {
      it("calls #dealerTurn", function() {
        spyOn(game, "dealerTurn")
        game.set("inProgress", true)
        game.set("turn", game.player)
        game.nextTurn()
        expect(game.get("turn")).toBe(game.dealer)
        expect(game.dealerTurn).toHaveBeenCalled()
      })
    })
  })
  
  describe("#dealerTurn", function() {
    describe("when dealer's hand value is < 17", function() {
      it("dealer hits", function() {
        var cards = [
          game.deck.find(function(card){ return card.get("rank") == 6}),
          game.deck.find(function(card){ return card.get("rank") == 10})
        ]
        game.dealer.addCards(cards)
        game.deck.remove(cards)
        spyOn(game.deck, "draw").andCallThrough()
        spyOn(game.dealer, "addCards").andCallThrough()
        game.dealerTurn()
        expect(game.dealer.addCards).toHaveBeenCalled()
        expect(game.deck.draw).toHaveBeenCalled()
        expect(game.dealer.get("hand").length).toBe(3)
      })
    })
    
    describe("when dealer's hand value is >= 17", function() {
      it("dealer stands", function() {
        game.dealer.addCards([new Card({suit: "hearts", rank: 7}), new Card({suit: "spades", rank: 10})])
        spyOn(game.deck, "draw").andCallThrough()
        spyOn(game.dealer, "addCards").andCallThrough()
        game.dealerTurn()
        expect(game.dealer.addCards).not.toHaveBeenCalled()
        expect(game.deck.draw).not.toHaveBeenCalled()
        expect(game.dealer.get("hand").length).toBe(2)
        expect(game.dealer.get("standing")).toBe(true)
      })
    })  
    
    it("ends dealer's turn", function() {
      spyOn(game, "trigger")
      game.dealerTurn()
      expect(game.trigger).toHaveBeenCalledWith("end:turn")
    }) 
  })
  
  describe("#hit", function(){
    it("gives person one card from the deck", function() {
      var person = new Person()
      spyOn(game.deck, "draw").andCallThrough()
      spyOn(game, "trigger")
      expect(person.get("hand").length).toBe(0)
      game.hit(person)
      expect(game.deck.draw).toHaveBeenCalled()
      expect(game.deck.length).toBe(51)
      expect(person.get("hand").length).toBe(1)
    })
    
    it("ends person's turn", function() {
      spyOn(game, "trigger")
      var person = new Person()
      game.hit(person)
      expect(game.trigger).toHaveBeenCalledWith("end:turn")
    }) 
  })
  
  describe("#getHandValue", function() {
    it("returns hand value of person accounting for ace", function() {
      var person = new Person()      
      person.addCards([
        new Card({suit: "spades", rank: 2}),
        new Card({suit: "spades", rank: 3})
      ])
      expect(game.getHandValue(person)).toBe(5)
      person.addCards(new Card({suit: "hearts", rank: "A"}).set("value", 11))
      expect(game.getHandValue(person)).toBe(16)
      person.addCards(new Card({suit: "hearts", rank: 10}))
      expect(game.getHandValue(person)).toBe(16)
    })
  })
  
  describe("#endGame", function() {
    it("marks game as not in progress", function() {
      game.set("inProgress", true)
      game.endGame()
      expect(game.get("inProgress")).toBe(false)
    })  
    
    describe("when player is the winner", function() {
      it("increases player's credit by bet value", function() {
        game.player.set("bet", 50)
        game.endGame(game.player, "Got 21")
        expect(game.player.get("credit")).toBe(550)
      })
    })
    
    describe("when player is not the winner", function() {
      it("decreases player's credit by bet value", function() {
        game.player.set("bet", 50)
        game.endGame(game.dealer, "Got 21")
        expect(game.player.get("credit")).toBe(450)
      })
    })
  })
  
  describe("#reset", function() {
    it("returns people's cards to the deck", function() {
      game.player.addCards(game.deck.draw(2))
      game.dealer.addCards(game.deck.draw(2))
      expect(game.player.get("hand").length).toBe(2)
      expect(game.dealer.get("hand").length).toBe(2)
      expect(game.deck.length).toBe(48)
      game.reset()
      expect(game.deck.length).toBe(52)
    })
    it("reshuffles the deck", function() {
      var oldFirstCard = game.deck.first()
      game.reset()
      expect(game.deck.first()).not.toBe(oldFirstCard)
    })
  })
  
  describe("#stand", function() {
    it("ends person's turn", function() {
      spyOn(game, "trigger")
      var person = new Person()
      game.stand(person)
      expect(game.trigger).toHaveBeenCalledWith("end:turn")
    })
    it("marks person as standing", function() {
      var person = new Person()
      game.stand(person)
      expect(person.get("standing")).toBe(true)
    })
  })
  
  describe("#onChangeTurn", function() {
    describe("when it's the dealer's turn", function() {
      it("calls #dealerTurn", function() {
        spyOn(game, "dealerTurn")
        game.set("turn", game.dealer)
        game.onChangeTurn()
        expect(game.dealerTurn).toHaveBeenCalled()
      })
    })
    
    describe("when it's a person's turn", function() {
      var person
      beforeEach(function() {
        person = new Person()
        game.set("turn", person)
      })
      describe("when person is standing", function() {
        it("ends the person's turn", function() {
          spyOn(game, "trigger")
          person.set("standing", true)
          game.onChangeTurn()
          expect(game.trigger).toHaveBeenCalledWith("end:turn")
        })
      })
      describe("when person is not standing", function() {
        it("does not end the person's turn", function() {
          spyOn(game, "trigger")
          game.onChangeTurn()
          expect(game.trigger).not.toHaveBeenCalledWith("end:turn")
        })
      })
    })
    
  })
})