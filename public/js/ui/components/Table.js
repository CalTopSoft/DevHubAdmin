export default function Table({ headers, data, actions }) {
    const table = document.createElement('div');
    table.className = 'table-container';
  
    const tableEl = document.createElement('table');
    tableEl.innerHTML = `
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${row.map((cell, i) => `<td>${cell === 'actions' ? actions(data[row.indexOf(cell)]) : cell}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    `;
    table.appendChild(tableEl);
    return table;
  }