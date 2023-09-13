// custom javascript

(function () {

    const API_URL = 'http://localhost:8004/tasks'

    document.querySelector('#form').addEventListener('submit', (e) => {
        e.preventDefault()
        let button = e.target.querySelector('button')
        let query = e.target.querySelector('textarea').value
        button.disabled = true

        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');

        let raw = JSON.stringify({
            'query': query
        })

        let requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        }

        fetch(API_URL, requestOptions)
            .then(response => response.text())
            .then(result => {
                let data = JSON.parse(result)
                for (const i in data) {
                    const html = `
                          <tr class="class-${data[i]['task_id']}">
                            <td>${data[i]['task_id']}</td>
                            <td>${data[i]['url']}</td>
                            <td>Pending...</td>
                          </tr>`
                    const newRow = document.getElementById('tasks').insertRow(0)
                    newRow.innerHTML = html
                }
                button.disabled = false
            })
            .catch(error => console.log('error', error))
    })
})();

// function handleSubmit() {
//
//   // fetch('/tasks', {
//   //   method: 'POST',
//   //   headers: {
//   //     'Content-Type': 'application/json'
//   //   },
//   //   body: JSON.stringify({ data: e.target.serializeToString() }),
//   // })
//   // .then(response => response.json())
//   // .then(data => {
//   //   console.log(data)
//   //   // getStatus(data.task_id)
//   // })
// }

function getStatus(taskID) {
    fetch(`/tasks/${taskID}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(res => {
            console.log(res)
            const html = `
      <tr>
        <td>${taskID}</td>
        <td>${res.task_status}</td>
        <td>${res.task_result}</td>
      </tr>`;
            const newRow = document.getElementById('tasks').insertRow(0);
            newRow.innerHTML = html;

            const taskStatus = res.task_status;
            if (taskStatus === 'SUCCESS' || taskStatus === 'FAILURE') return false;
            setTimeout(function () {
                getStatus(res.task_id);
            }, 1000);
        })
        .catch(err => console.log(err));
}
