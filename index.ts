import './style.css';
import 'simscript/dist/simscript.css';
import { SimulationState, format } from 'simscript';
import { GroceryStore } from './grocerystore';

// get the start button
const btnStart = document.getElementById('start') as HTMLButtonElement;

// run the simulation
btnStart.addEventListener('click', (e) => {
  const numCashiers = document.getElementById('numCashiers').value;

  // make sure there are at least 1 line
  if (numCashiers < 1) {
    alert('You must have at least one cashier');
    return;
  }

  // create the simulation
  const sim = new GroceryStore(numCashiers);

  // start the simulation
  sim.start();
  btnStart.disabled = true;

  sim.stateChanged.addEventListener(() => {
    if (sim.state == SimulationState.Finished) {
      // enable start button
      btnStart.disabled = false;

      // sum the number of customers served in each line
      const totalCustomers = sim.qCheckouts.reduce(
        (accumulator, curItem) => accumulator + curItem.grossDwell.cnt,
        0
      );

      // show simulation statistics
      document.getElementById('output').innerHTML =
        `
        <ul>
          <li>Simulated time: <b>${format(sim.timeNow / 60, 0)}</b> hours</li>
          <li>Cashier Utilization: ${sim.qCheckouts.map(
            (line) => ` <b>${format(line.grossPop.avg * 100)}%</b>`
          )}</li>
          <li>Average Wait in Lines (min): ${sim.qLines.map(
            (line) => ` <b>${format(line.line.grossDwell.avg)}</b>`
          )}</li>
          <li>Longest Wait in Lines (min): ${sim.qLines.map(
            (line) => ` <b>${format(line.line.grossDwell.max)}</b>`
          )}</li>
          <li>Average Checkout Times (min): ${sim.qCheckouts.map(
            (line) => ` <b>${format(line.grossDwell.avg)}</b>`
          )}</li>
          <li>Longest Checkout Times (min): ${sim.qCheckouts.map(
            (line) => ` <b>${format(line.grossDwell.max)}</b>`
          )}</li>
          <li>Customers Served: <b>${totalCustomers}</b></li>
      </ul>` + sim.getStatsTable(false);
    }
  });
});
