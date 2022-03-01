const { shell } = require('electron');
const util = require('util');
const exec = util.promisify(require('child_process').exec)
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const fluent = require('fluent-ffmpeg');
let ffprobe = global.ffprobe
let ffmpeg = global.ffmpeg

module.exports.startRender = async function (arg, event, win, dev) {
    // event.preventDefault() // stop the form from submitting
    // start render
    let args = []

    fluent.setFfprobePath(ffprobe)
    fluent.setFfmpegPath(ffmpeg)

    let fileSelect = arg.fileSelect
    let fileName = arg.fileSelect_name.split('.')[0]

    args.push('-i', `${fileSelect.split(/ +/).join('\\ ')}`);
    // If encoder is CPU use libx264, Nvidia GPU use nvenc, Intel GPU use qsv, AMD GPU use amd
    if (arg.encoder === 'cpu') {
        args.push('-c:v', 'libx264');
    } else if (arg.encoder === 'nvidia') {
        args.push('-c:v', 'h264_nvenc');
    } else if (arg.encoder === 'intel') {
        args.push('-c:v', 'h264_qsv');
    } else if (arg.encoder === 'amd') {
        args.push('-c:v', 'h264_amf');
    }
    args.push('-qp', '29');
    // add crf
    args.push('-crf', '15');

    // Preset from data
    args.push('-preset', arg.preset);
    // Audio format from data
    args.push('-c:a', arg.audio);
    // Lowercase pixel format from data and push


    // add K after last number for bitrate
    let bitrate = (arg.bitrate / 1000).toFixed(1) + 'M';
    args.push('-b:v', bitrate);
    args.push('-pix_fmt', arg.pixel.toLowerCase());
    // Force 60fps
    // args.push('-r', '60');
    // Replace video if exists
    // Output file with name of input file ended with _60fps.mp4
    let output
    // Output to Videos folder from Users folder
    output = `${process.env.USERPROFILE}\\Videos\\`

    args.push('-rc-lookahead', '15');

    args.push('-vf', `scale=-1:${arg.resolution.split(/ +/).join('')}`);

    args.push(output + fileName.split(/ +/).join('\\ ') + '_60fps.mp4');
    args.push('-y');
    let currentTime = process.hrtime()
    console.log(ffmpeg + args.join(' '));
    let ffmpegProcess
    ffmpegProcess = spawn(ffmpeg, args)
    ffmpegProcess.stdout.setEncoding('utf8');
    ffmpegProcess.stderr.setEncoding('utf8');
    ffmpegProcess.stdout.on(`data`, (data) => {
        console.log(data);
    });
    ffmpegProcess.stdout.on(`close`, (data, error) => {
        if (error) {
            console.error(`exec error: ${error}`);
        }
        // Finish render
        let eplasedTime = process.hrtime(currentTime)
        win.webContents.send('render-finish', (output, eplasedTime));
        // Open folder with the video selected
        shell.openPath(output);
        // Flash the app 
        win.flashFrame(true)
    })
}
