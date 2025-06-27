import {
  Simulation,
  Queue,
  Entity,
  Normal,
  Exponential,
  Triangular,
} from 'simscript';

// A SimScript Simulation, which represents a grocery store with a variable amount of checkouts.
export class GroceryStore extends Simulation {
  // The array of Queues representing the waiting lines for the checkouts.
  qLines = [];

  // The array of Queues representing the checkout stations.
  qCheckouts = [];

  // The number of lines to create.
  numLines;

  constructor(numLines: number) {
    super();
    this.numLines = numLines;

    // fill the lines and checkouts
    for (let i = 0; i < this.numLines; i++) {
      // store the index of the line with the line
      this.qLines[i] = { line: new Queue('Line ' + (i + 1)), index: i };

      // give each checkout a maximum capacity of 1
      this.qCheckouts[i] = new Queue('Checkout ' + (i + 1), 1);
    }
  }

  onStarting() {
    super.onStarting();

    // set simulation length to 12 hours
    this.timeEnd = 60 * 12;

    // generate an average of 1 customer per minute
    this.generateEntities(Customer, new Exponential(1));
  }
}

// A SimScript Entity, representing a customer buying items at a grocery store.
class Customer extends Entity<GroceryStore> {
  // Distribution for the number of items the customers have (mean = 20, standard deviation = 15).
  numItemsDist = new Normal(20, 15, true);

  // Distribution for the number of seconds it takes for the cashier to scan each item, since this can vary with the cashier's competency and energy levels (min = 2, mode = 2.5, max = 4).
  secondsPerItem = new Triangular(2, 2.5, 4);

  // Distribution for the number of seconds it takes for the customer to pay for their groceries and leave clear out of the area (min = 10, mode = 25, max = 60).
  paymentTime = new Triangular(10, 25, 60);

  // The script that runs when the customer is created.
  async script() {
    const store = this.simulation;

    // calculate the number of grocery items the customer has
    const numItems = this.numItemsDist.sample() + 1; // ensure at least 1 item

    // create a copy of the qLines array and sort it based on the number of items the people in them have
    const sortedLines = store.qLines
      .slice()
      .sort((a, b) => a.line.unitsInUse - b.line.unitsInUse);

    // randomly select either the first or the second shortest line to prevent buildups in the first line
    const rand = Math.min(
      Math.floor(Math.random() * 2),
      store.qCheckouts.length
    );

    // get the original index from the index field of the line
    const chosenLineIndex = sortedLines[rand].index;

    // enter the line
    this.line(
      numItems,
      store.qLines[chosenLineIndex].line,
      store.qCheckouts[chosenLineIndex]
    );
  }

  // The customer's behavior once they have entered a line.
  // Parameters:
  // - numItems: the number of grocery items the customer has
  // - line: the Queue for the line the customer is entering
  // - checkout: the Queue for the checkout at the end of the line
  async line(numItems, line, checkout) {
    // enter the line with the number of grocery items
    await this.enterQueue(line, numItems);

    // wait until the checkout can be entered
    await this.enterQueue(checkout);

    // leave the line
    this.leaveQueue(line);

    // calculate checkout time in seconds
    const checkoutTime =
      numItems * this.secondsPerItem.sample() + this.paymentTime.sample();

    // stay in the checkout for the calculated amount of time
    await this.delay(checkoutTime / 60); // convert to minutes

    // leave the checkout, freeing it for the next customer
    this.leaveQueue(checkout);

    // log showing that despite the console errors saying that the entity exited without leaving the line, the entity does not appear in the line's list of entities
    console.log(
      'Entity: ' +
        this.toString() +
        ' Entities in ' +
        line.name +
        ': ' +
        line.entities
    );
  }
}
