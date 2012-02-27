describe("BlackjackGame", function(){
  var game
  
  beforeEach(function() {
    game = new BlackjackGame()
  })
  
  it("has a new shuffled deck of cards", function(){
    spyOn(Deck.prototype, "shuffle")
    // New game since we need to spy before creation
    game = new BlackjackGame()
    expect(game.deck).toBeDefined()
    expect(game.deck.shuffle).toHaveBeenCalled()
  })
  
  it("overrides non-number cards proper blackjack values", function() {
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
  
  it("refreshes game state when player or dealer get new cards", function(){
    spyOn(BlackjackGame.prototype, "refreshState")
    game = new BlackjackGame
    game.player.trigger("change:hand")
    expect(game.refreshState).toHaveBeenCalled()
  })
  
  it("refreshes game state when layer or dealer get new cards", function(){
    spyOn(BlackjackGame.prototype, "refreshState")
    game = new BlackjackGame
    game.dealer.trigger("change:hand")
    expect(game.refreshState).toHaveBeenCalled()    
  })
  
  it("calls #nextTurn when person ends their turn", function(){
    spyOn(BlackjackGame.prototype, "nextTurn")
    var diffGame = new BlackjackGame
    diffGame.trigger("end:turn")
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
  })  
  
  describe("#refreshState", function(){
    describe("when player's hand is over 21", function() {
      it("triggers end:game event", function() {
        spyOn(game.player.get("hand"), "value").andReturn(22)
        var loseCallback = jasmine.createSpy()
        game.on("end:game", loseCallback)
        game.refreshState.call(game)
        expect(loseCallback).toHaveBeenCalled()
      })
    })
  })
  
  describe("#nextTurn", function() {
    it("sets turn to next person", function() {
      var person1 = new Person()
      var person2 = new Person()
      game.people = [person1, person2]
      game.set("turn", person1)
      game.nextTurn()
      expect(game.get("turn")).toBe(person2)
      game.nextTurn()
      expect(game.get("turn")).toBe(person1)
    })    
    
    /*
      TODO give each person its own AI method. Dealer will have a method that will be called on his every turn.
      The player's AI method will be empty, allowing real players to make their move.
      A new event should probably be created called "end:turn" which will trigger #nextTurn to be called.
      #nextTurn should call the next person's UI method
    */
    
    describe("when next turn is dealer's", function() {
      it("calls #dealerTurn", function() {
        spyOn(game, "dealerTurn")
        game.set("turn", game.player)
        game.nextTurn()
        expect(game.get("turn")).toBe(game.dealer)
        expect(game.dealerTurn).toHaveBeenCalled()
      })
    })
  })
  
  describe("#dealerTurn", function() {
    describe("when dealer's hand value is < 17", function() {
      it("dealer hits and ends turn", function() {
        game.dealer.addCards([new Card({suit: "hearts", rank: 6}), new Card({suit: "spades", rank: 10})])
        spyOn(game.deck, "draw").andCallThrough()
        spyOn(game.dealer, "addCards").andCallThrough()
        game.dealerTurn()
        expect(game.dealer.addCards).toHaveBeenCalled()
        expect(game.deck.draw).toHaveBeenCalled()
        expect(game.dealer.get("hand").length).toBe(3)
      })
    })
    
    describe("when dealer's hand value is >= 17", function() {
      it("dealer stands and ends turn", function() {
        game.dealer.addCards([new Card({suit: "hearts", rank: 7}), new Card({suit: "spades", rank: 10})])
        spyOn(game.deck, "draw").andCallThrough()
        spyOn(game.dealer, "addCards").andCallThrough()
        game.dealerTurn()
        expect(game.dealer.addCards).not.toHaveBeenCalled()
        expect(game.deck.draw).not.toHaveBeenCalled()
        expect(game.dealer.get("hand").length).toBe(2)
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
})