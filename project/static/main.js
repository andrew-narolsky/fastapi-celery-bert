(function () {

    const API_URL = 'http://localhost:8004/tasks'
    window.result_data = {}

    document.querySelector('#download').addEventListener('click', saveDocument)

    document.querySelector('#form').addEventListener('submit', (e) => {
        e.preventDefault()
        let textarea = e.target.querySelector('textarea')

        if (textarea.classList.contains('is-invalid')) textarea.classList.remove('is-invalid')

        let button = e.target.querySelector('button')
        let query = textarea.value
        let result_wrap = document.querySelector('#result_wrap')
        let form_wrap = document.querySelector('#form_wrap')

        if (!query) {
            textarea.classList.add('is-invalid')
            return false
        }

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

        // TODO;
        // let data = {
        //     "1": {
        //         "url": "https://en.wikipedia.org/wiki/List_of_Austrian_football_champions",
        //         "task_id": "b92ec3be-d403-4474-9b48-fa41b851be74"
        //     },
        //     "2": {
        //         "url": "https://en.wikipedia.org/wiki/History_of_the_European_Cup_and_UEFA_Champions_League",
        //         "task_id": "c7c26778-75ab-472c-baae-3cc09926771b"
        //     },
        //     "3": {
        //         "url": "https://www.uefa.com/uefachampionsleague/history/clubs/50024--wiener-sc/",
        //         "task_id": "33ac7860-e9b8-4f00-97de-e0dd36778a8c"
        //     }
        // }

        // window.result_data = data
        //
        // for (const i in data) {
        //     const html = `
        //           <tr class="class-${data[i]['task_id']}">
        //             <td>${data[i]['task_id']}</td>
        //             <td>${data[i]['url']}</td>
        //             <td class="status">Pending...</td>
        //           </tr>`
        //     const newRow = document.getElementById('tasks')
        //     newRow.insertAdjacentHTML('beforeend', html)
        //     const progress = Math.round((i * 100) / Object.keys(data).length)
        //
        //     setTimeout(() => {
        //         getStatus(data[i]['task_id'], progress, i)
        //     }, 2000 * i)
        // }
        //
        // setTimeout(() => {
        //     form_wrap.style.display = 'none'
        //     result_wrap.style.display = 'block'
        // }, 1000)

        // TODO;

        fetch(API_URL, requestOptions)
            .then(response => response.text())
            .then(result => {
                let data = JSON.parse(result)

                console.log(data)

                if (!data) {
                    alert('Error! Try later')
                    return false
                }

                window.result_data = data

                for (const i in data) {
                    const html = `
                          <tr class="class-${data[i]['task_id']}">
                            <td>${data[i]['task_id']}</td>
                            <td>${data[i]['url']}</td>
                            <td class="status">Pending...</td>
                          </tr>`
                    const newRow = document.getElementById('tasks')
                    newRow.insertAdjacentHTML('beforeend', html)
                    const progress = Math.round((i * 100) / Object.keys(data).length)

                    setTimeout(() => {
                        getStatus(data[i]['task_id'], progress, i)
                    }, 2000 * i)
                }

                setTimeout(() => {
                    form_wrap.style.display = 'none'
                    result_wrap.style.display = 'block'
                }, 500)

                // console.log(data)
                // for (const i in data) {
                //     const html = `
                //           <tr class="class-${data[i]['task_id']}">
                //             <td>${data[i]['task_id']}</td>
                //             <td>${data[i]['url']}</td>
                //             <td>Pending...</td>
                //           </tr>`
                //     const newRow = document.getElementById('tasks').insertRow(0)
                //     newRow.innerHTML = html
                // }
                // button.disabled = false
            })
            .catch(error => console.log('error', error))
    })

    function getStatus(taskID, progress, num) {
        fetch(`/tasks/${taskID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
            .then(response => response.json())
            .then(res => {
                const taskStatus = res.task_status
                if (taskStatus === 'SUCCESS' || taskStatus === 'FAILURE') {
                    document.querySelector('.class-' + taskID + ' .status').innerText = 'Success'
                    document.querySelector('.progress-bar').style.width = progress + '%'
                    if (parseInt(progress) === 100) {
                        document.querySelector('#download').disabled = false
                    }
                    window.result_data[num]['position'] = parseInt(num)
                    window.result_data[num]['score'] = res.task_result.score
                    window.result_data[num]['answers'] = res.task_result.answers.toString()
                    return false
                }
                setTimeout(function () {
                    getStatus(res.task_id, progress, num)
                }, 1000)
            })
            .catch(err => console.log(err))
    }

    async function saveDocument() {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sheet1');

        sheet.columns = [
            {header: 'Position', key: 'position', width: 10},
            {header: 'Url', key: 'url', width: 70},
            {header: 'Bert Score', key: 'score', width: 15},
            {header: 'Answers', key: 'answers', width: 100}
        ]

        sheet.getRow(1).font = {bold: true}

        Object.keys(window.result_data).map(value => {
            sheet.addRow({
                position: window.result_data[value]['position'],
                url: window.result_data[value]['url'],
                score: window.result_data[value]['score'],
                answers: window.result_data[value]['answers'],
            })
        })

        await workbook.xlsx.writeBuffer().then(function (data) {
            const blob = new Blob(
                [data],
                {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
            )
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = 'result.xlsx'
            link.click()
            link.remove()
        })
    }
})()
