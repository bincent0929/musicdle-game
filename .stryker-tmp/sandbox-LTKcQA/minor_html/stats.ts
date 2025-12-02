// @ts-nocheck
declare const Chart: any; //was having issue with Chart object in Typescript, this seemed to fix it

document.addEventListener('DOMContentLoaded', function(): void {
            /**
             * this allows us to have functions work on newly added HTML
             */
            

            /*
            info for the bar graph's stats and colors
            */

            const xBar = ["1", "2", "3", "4", "5+"];
            const yBar = [10, 8, 6, 4, 2];
            const barColors = ["red", "green","blue","orange","brown"];

            const bar = document.getElementById('barChart');



            (document.getElementById("maxStreak") as HTMLElement).textContent = getMaxStreak();
            (document.getElementById("topGenre") as HTMLElement).textContent = getTopGenre();
            (document.getElementById("topSong") as HTMLElement).textContent = getTopSong();


            //functions for retrieving info from the current user
            function getMaxStreak(){ 

                return "idk";
            }

            function getTopGenre(){

                return "irdk";
            }
            function getTopSong(){
                    
                return "irrrdk";
            }
            
            new Chart(bar, {
            type: "bar",
            data: {
                labels: xBar,
                datasets: [{
                backgroundColor: barColors,
                    data: yBar
                    }]
                    },
        options: {
            plugins: {
            legend: {display: false},
            title: {
                display: true,
                text: "Global Song Guessing Streak",
                font: {size: 20}
            }
            }
        }
        });
            
        });