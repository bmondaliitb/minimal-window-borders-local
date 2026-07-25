# minimal-window-borders-local
we don't need to install gnome-shell-extesnsion app.

## Install 

The extension is installed under (you can git clone inside the folder
or simply put the files there)
```
- mkdir ~/.local/share/gnome-shell/extensions/minimal-window-borders@local/
- copy the files inside the folder
```

Log out then in
```
gnome-extensions enable minimal-window-borders@local
```

To uninstall 
```
gnome-extensions disable minimal-window-borders@local
rm -rf ~/.local/share/gnome-shell/extensions/minimal-window-borders@local
```

Watch gnome-shell error with
```
journalctl -f -o cat /usr/bin/gnome-shell
```
