"use client"

import React,{useEffect, useRef,Component} from 'react';
import * as echarts from 'echarts';

export default class Ble extends Component {

    characteristic;
    constructor() {
        super();
        this.chartRef = React.createRef();
        this.state = { chartData: [], deviceName:''};
        this.BLEConnect = this.BLEConnect.bind(this);
    }

    heartRateChange(event){
        const value = event.target.value;
        const currentHeartRate = value.getUint8(1);
        const chartData = [...this.state.chartData, [+Date.now(),currentHeartRate]];
        this.setState({chartData});
        console.log('currentHeartRate:', currentHeartRate);
    }

    BLEConnect(){
        return navigator.bluetooth.requestDevice({filters: [{services: ['heart_rate']}]})
            .then(device => {
                this.setState({...this.state, deviceName:device.name});
                return device.gatt.connect();
            })
            .then(server => {
                return server.getPrimaryService('heart_rate')
            })
            .then(service => {
                return service.getCharacteristic('heart_rate_measurement')
            })
            .then(character => {
                this.characteristic = character;
                return this.characteristic.startNotifications().then(_ => {
                    this.characteristic.addEventListener('characteristicvaluechanged',
                        this.heartRateChange.bind(this));
                });
            })
            .catch(e => console.error(e));
    }


    initChart = () => {
        if (!this.chartRef.current) return;
        const chartInstance = echarts.init(this.chartRef.current);
        const option = {
            title: {
                text: 'Heart Rate'
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'time',
                name: 'Time'
            },
            yAxis: {
                type: 'value',
                name: 'BPM'
            },
            series: [{
                name: 'Heart Rate',
                type: 'line',
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    width: 2
                },
                data: this.state.chartData,
            }]
        };
        chartInstance.setOption(option);
        this.chartInstance = chartInstance;

        window.addEventListener('resize', () => {
            chartInstance.resize();
            });
        }

    updateChartData = () => {
        if (this.chartInstance) {
        this.chartInstance.setOption({
            series: [{
                data: this.state.chartData
            }]
        });
        }
    }

    componentDidMount() {
        this.initChart();
        this.updateChartData();
    }

    componentDidUpdate() {
        this.updateChartData();
    }

    render() { 
        const currentHearRate = this.state.chartData[this.state.chartData.length-1];
        const deviceName = this.state.deviceName;
        return(
            <div style={{ width: '100%'}}>
                <div className='flex justify-center items-center'>
                    {!currentHearRate && <button className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded' onClick={this.BLEConnect} >Start Monitoring!</button>}
                    {currentHearRate && <p>Current Heart Rate {`[ ${deviceName} ]`}: <span style={{color:'#C20000'}}>{currentHearRate[1]}</span></p>}
                </div>
                <div ref={this.chartRef}  style={{ width: '100%', height: '500px' }}></div>
            </div>
        );
    }
}
