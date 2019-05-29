var getSelectedVolumes = function(volumes, selectedVolumeIds) {
    var selectedVolumes = [];
    var volume;
    for (var i = 0; i < volumes.length; i++) {
        volume = volumes[i];
        if (selectedVolumeIds.indexOf(volume.id) !== -1) {
        selectedVolumes.push(volume);
        }
    }
    return selectedVolumes;
};

function vectorchange(xCoord, yCoord, angle, length) {
    length = typeof length !== 'undefined' ? length : 10;
    angle = angle * Math.PI / 180; // if you're using degrees instead of radians
    return [length * Math.cos(angle) + xCoord, length * Math.sin(angle) + yCoord];
}

function FindMaxOffset(volin, minsize, maxsize, level) {
    if(level > 25) { return ((maxsize + minsize) / 2); }
    var offvol = EASEL.volumeHelper.expand([volin], (-1 * (maxsize + minsize) / 2));
    if(offvol === null) {
      //console.log('Null ' + level);
      maxsize = (maxsize + minsize) / 2;
      return FindMaxOffset(volin, minsize, maxsize, level + 1);
    } else {
      //console.log('Not Null ' + level);
      minsize = (maxsize + minsize) / 2;
      return FindMaxOffset(volin, minsize, maxsize, level + 1);
    }
  }