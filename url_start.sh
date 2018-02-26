#!/bin/bash
# TODO docker-compose down -v
function help () {
  cat << EOF
usage: ./url_start.sh [-h] [-c] [-i NIC]

Wrapper script for launching the "Let's Talk!" application with docker-compose.
Probably cross-compatible with POSIX-compliant shells.

optional arguments:
  -h      show this help message and exit
  -c      delete the MySQL database before starting, a new one will be created.
  -i NIC  specify the network interface for private IP address. (default: enp3s0)
          Set this option to "windows" if you're using Docker Toolbox on Windows and GIT shell. 
EOF
}

# default values
clean=0;
nic=enp3s0

while getopts ":hci:" opt; do
  case $opt in
  h  ) help                                             && exit 0 ;;
  c  ) clean=1                                                    ;;
  i  ) nic=${OPTARG,,}                                            ;;
  \? ) echo "Invalid option: -$OPTARG" >&2              && exit 1 ;;
  :  ) echo "Option -$OPTARG requires an argument." >&2 && exit 1 ;;
  esac
done

printf "\t%s\n\n" "$(tput setaf 2)Let's Talk! $(tput setaf 6)└( ^o^)$(tput setaf 4)Ｘ$(tput setaf 5)(^◡^ )ノ$(tput sgr0)"

# check if system uses systemd
is_systemd=0
which systemctl 1> /dev/null 2> /dev/null && systemctl > /dev/null && is_systemd=1
function running () {
  [ "$is_systemd" -eq "0" ] && return 2 # current machine does not use systemd
  systemctl is-active --quiet $1        # checks if the service is running
  # always returns 0 if service is active
  # returns 3 if machine usus systemd but the service is dead
}

NODE_PORT=${PORT:-8080}
if [[ $NODE_PORT = 80 ]]; then
  disp_port=""
else
  disp_port=":$NODE_PORT"
fi

# try to figure out my private IP address
private_ip=none
personal=localhost

if [ "$nic" = "windows" ]; then
  personal=$(docker-machine ip)
else
  if which ip > /dev/null 2> /dev/null ; then # maybe UNIX?
    private_ip=$(ip addr show $nic | awk '/inet / {sub(/\/.*/, "", $2); print $2}')
  else
    # try to predict if we're on Windows using Docker Toolbox
    uname=$(uname)
    uname=${uname^^}
    if [[ $uname = *"MINGW"* ]]; then
      echo "Are you using Docker Toolbox on Windows?"
      echo "If so, please invoke this script with the appropriate parameters: $(tput bold)./url_start.sh -i windows$(tput sgr0)"
	fi
  fi
fi

dim=$(tput dim)
reset=$(tput sgr0)
bold=$(tput bold)
underline=$(tput smul)

strf="%-30s%s\n"
prefix='http://'

printf $strf "${dim}Local:${reset}" "${bold}${underline}${prefix}${personal}${disp_port}/${reset}"
running avahi-daemon && \
printf $strf "${dim}Avahi mDNS:${reset}" "${bold}${underline}${prefix}$(hostname).local${disp_port}/${reset}"
[[ $private_ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && \
printf $strf "${dim}Private IP (LAN):${reset}" "${bold}${underline}${prefix}${private_ip}${disp_port}/${reset}"


# if machine uses systemd and docker is inactive, let's try to start it
running docker
if [ "$?" -eq "3" ]; then
  set -x
  systemctl start docker
  set +x
fi

# host mount point for MySQL data
db=database/sql
mkdir -p $db

# purge database files if asked to
if [ "$clean" = "1" ]; then
  set -e # quit on failure
  set -x
  docker-compose down -v
  sudo rm -r $db
  mkdir $db
  set +x
  set +e
fi

PORT=$NODE_PORT docker-compose up
