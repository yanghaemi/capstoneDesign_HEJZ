package com.HEJZ.HEJZ_back.domain.dance.model;

import jakarta.persistence.*;
import com.HEJZ.HEJZ_back.domain.dance.model.SelectedMotion;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@Entity
@Getter
@Setter
public class LyricsSelectionGroup {

    @Id
    @GeneratedValue
    private Long id;

    private String lyricsGroup;

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "selectionGroup", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<SelectedMotion> motions = new ArrayList<>();
}
